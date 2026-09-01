.PHONY: all install build dev start db-migrate db-seed clean

all: install

# Install Node.js dependencies
install:
	npm install

# Run Prisma DB migration (first time or after schema changes)
db-migrate:
	npx prisma migrate dev --name init
	npx prisma generate

# Seed the database with initial data (Admin, Teacher, Students, Group)
db-seed:
	npx tsx prisma/seed.ts

# Build the production Next.js bundle
build:
	npm run build

# Start the development server (Next.js + Socket.io)
dev:
	npm run dev

# Start the production server
start:
	npm run start

# Remove build artifacts
clean:
	rm -rf .next dist
