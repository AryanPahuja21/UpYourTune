FROM node:18

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only dependency files first
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies in container
RUN pnpm install

# Copy the rest of the code
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
