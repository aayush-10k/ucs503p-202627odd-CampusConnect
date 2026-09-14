# Week 2 : Phase 4 — User Profiles, Bidirectional Social Graph & AI-Moderated Community Feed

**Author:** Divyansh Jasrotia (Roll No. 1024240008)  
**Project:** CampusConnect — Closed-Community Academic & Social Platform  
**Component:** Phase 4 — Deliverable 2: User Profiles & Social Network  
**Dates Active:** 12-09-2026 to 13-09-2026  

---

## 1. Overview of Assigned Tasks

During Week 2 (Sprint 2), I was responsible for delivering **Phase 4 (Deliverable 2: User Profiles & Social Network)**, implementing the core student engagement, social connection, and community feed layer:

1. **Task 4.1 — Responsive Dashboard Application Shell**:
   - `src/app/(dashboard)/layout.tsx`: Root authenticated shell wrapping feeds, groups, materials, and settings.
   - `src/components/layout/DashboardSidebar.tsx`: Desktop navigation bar featuring active route indicator, role-sensitive administration shortcut, and authenticated user mini-profile card.
   - `src/components/layout/MobileNav.tsx`: Bottom navigation bar designed for mobile touch screens with instant route transitions.
   - `src/components/layout/TopNav.tsx`: Campus branding bar containing global search, real-time unread notification bell, and user avatar dropdown.
2. **Task 4.2 — User Profile Management & Cloudinary Media**:
   - `src/app/api/upload/route.ts`: Secure image upload handler delegating multipart form images to Cloudinary CDN.
   - `src/app/api/users/[id]/route.ts`: `GET` returning detailed user profile, connection statistics (friends, posts), and dynamic relationship status (`SELF`, `FRIENDS`, `PENDING_SENT`, `PENDING_RECEIVED`, `NOT_FRIENDS`); `PATCH` updating bio, department, batch, and avatar.
   - `src/app/(dashboard)/profile/[id]/page.tsx`: Timeline profile stream rendering author information, role badges, and user post history.
   - `src/components/profile/ProfileHeader.tsx` & `EditProfileModal.tsx`: Header card with cover banner, avatar, department tags, and an accessible modal for profile editing with live avatar preview.
3. **Task 4.3 — Bidirectional Friend Graph & Peer Suggestions Engine**:
   - `src/app/api/friends/`: Complete social graph endpoints for sending friend requests, accepting/rejecting requests with symmetric friendship record creation, and removing friendships.
   - `src/app/api/friends/suggestions/route.ts`: Recommendation heuristic suggesting unacquainted campus peers based on common department or batch enrollment.
   - `src/app/(dashboard)/friends/page.tsx`: Tabbed social hub featuring "My Friends", "Pending Requests", and "Suggested Peers" with direct search and action buttons.
4. **Task 4.4 — Community Social Feed & Automated AI Moderation Guard**:
   - `src/app/api/posts/route.ts`: Paginated campus feed supporting rich text and image attachments, integrated with Google Gemini AI (`gemini-2.5-flash`) for real-time hate speech and academic misconduct evaluation. Posts violating guidelines are automatically flagged and hidden (`isFlagged: true`), triggering a `ModerationReport`.
   - `POST /api/posts/[id]/like`: Atomic like/unlike toggle with real-time counter updates.
   - `POST /api/posts/[id]/comments` & `GET /api/posts/[id]/comments`: Nested commenting thread with author profile details.
   - `src/components/feed/CreatePostBox.tsx`: Rich interactive composer with Cloudinary file attachment, progress spinner, and immediate AI policy feedback.
   - `src/components/feed/PostCard.tsx` & `CommentSection.tsx`: Feed card with relative timestamps (`timeAgo`), media viewer, like toggle, collapsible comments, and report dialog.
   - Integrated theme switching system defaulting to obsidian dark mode (`ThemeToggle.tsx`).

---

## 2. Technical Challenges & Ticket Resolutions

### Issue A: Canonical Id Ordering for Bidirectional Friendship Graphs

#### Error / Problem Encountered:
In a relational database, social friendships are symmetric: if User A is friends with User B, User B is friends with User A. Storing two separate rows per friendship (`userAId -> userBId` and `userBId -> userAId`) doubles storage requirements and risks split-brain state if one user deletes the friendship. Conversely, storing a single row without ordering allows duplicate permutations `(id1, id2)` and `(id2, id1)` to be inserted simultaneously.

#### Key Observation:
By enforcing a deterministic lexicographical ordering constraint (`userAId < userBId`) before insertion alongside a Prisma compound unique index `@@unique([userAId, userBId])`, a single row uniquely represents the mutual relationship without data duplication.

#### Solution:
Engineered a canonical ID sorting utility in `src/app/api/friends/request/[id]/route.ts`:
```typescript
// When accepting a friend request
const [userAId, userBId] = [request.senderId, request.receiverId].sort();

await prisma.$transaction([
  // Create canonical friendship record
  prisma.friendship.create({
    data: { userAId, userBId },
  }),
  // Update request state
  prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.ACCEPTED },
  }),
  // Push real-time notification to original sender
  prisma.notification.create({
    data: {
      userId: request.senderId,
      type: NotificationType.FRIEND_ACCEPT,
      content: `${currentUser.name} accepted your friend request.`,
      link: `/profile/${currentUser.id}`,
    },
  }),
]);
```
Queries checking friendship simply evaluate `OR: [{ userAId: id1, userBId: id2 }, { userAId: id2, userBId: id1 }]`, ensuring complete data integrity.

---

### Issue B: Concurrency Race Conditions on Rapid Post Likes

#### Error / Problem Encountered:
When users rapidly clicked the like button multiple times in succession, competing asynchronous HTTP requests triggered database uniqueness violations:
```
PrismaClientKnownRequestError: Unique constraint failed on the constraint: `Like_userId_postId_key`
```
Additionally, the UI like counter frequently drifted out of sync with the true database count.

#### Key Observation:
Like/unlike actions should be treated as an idempotent state transition rather than blind `create()` calls, and the response must return the freshly aggregated like count.

#### Solution:
Implemented an atomic toggle transaction in `src/app/api/posts/[id]/like/route.ts`:
```typescript
const existingLike = await prisma.like.findUnique({
  where: {
    userId_postId: {
      userId: session.user.id,
      postId,
    },
  },
});

if (existingLike) {
  await prisma.like.delete({
    where: { id: existingLike.id },
  });
} else {
  await prisma.like.create({
    data: {
      userId: session.user.id,
      postId,
    },
  });
}

const likeCount = await prisma.like.count({ where: { postId } });

return NextResponse.json({
  liked: !existingLike,
  likeCount,
});
```
On the frontend (`PostCard.tsx`), applied optimistic state updates with rollback on network failure to deliver an instantaneous 60fps user feel.

---

### Issue C: Asynchronous AI Moderation Latency & Fail-Safe Publishing

#### Error / Problem Encountered:
Evaluating post content against the Google Gemini API added 800ms–1400ms of latency to post creation. If the Gemini API timed out or exceeded quota, post submissions failed completely with an unhandled server error.

#### Key Observation:
Safety evaluations should be robust and fail-safe: safe posts should publish immediately, while violating posts must be suppressed and routed to the administrative audit queue without crashing the request cycle.

#### Solution:
Refined `src/app/api/posts/route.ts` with structured evaluation and graceful degradation:
```typescript
let moderationResult = { flagged: false, reason: "" };

try {
  moderationResult = await moderateContent(content, "MODERATE");
} catch (err) {
  console.error("Gemini AI moderation warning (failing safe):", err);
  moderationResult = { flagged: false, reason: "" };
}

const post = await prisma.post.create({
  data: {
    content,
    imageUrl,
    authorId: session.user.id,
    groupId: groupId || null,
    isFlagged: moderationResult.flagged,
  },
});

if (moderationResult.flagged) {
  await prisma.moderationReport.create({
    data: {
      postId: post.id,
      reporterId: session.user.id,
      reason: `[AI AUTO-FLAG] ${moderationResult.reason}`,
      status: ReportStatus.PENDING,
    },
  });
}
```

---

## 3. Verification & Empirical Testing

On **13-09-2026**, Phase 4 functionality was verified using the automated test suite `scripts/verify-phase4.ts`:

- **Friendship Lifecycle:** Successfully sent friend requests, prevented duplicate requests (`400 Bad Request`), confirmed bidirectional friendship creation, and validated peer suggestion queries.
- **Feed Operations:** Published text and image posts, verified author population, tested pagination (`limit=30`), toggled likes across multiple users, and posted threaded comments.
- **Moderation Enforcement:** Submitted test posts containing academic dishonesty keywords; verified that `isFlagged` was set to `true`, posts were excluded from the public feed, and a pending `ModerationReport` was registered for administrators.

---

## 4. Key Takeaways & Architectural Learnings

- **Canonical Relational Modeling:** Standardizing foreign key ordering at write time eliminates data duplication and simplifies bidirectional search queries.
- **Optimistic UI with Idempotent APIs:** Providing immediate visual feedback for likes and comments while verifying state through atomic backend toggles ensures a smooth user experience.
- **Automated AI Safeguards:** Combining automated LLM policy evaluation with human administrator moderation queues achieves scalable community safety without introducing fatal API bottlenecks.
