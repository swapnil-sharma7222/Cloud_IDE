# docker-image/Dockerfile

FROM node:alpine

# Create and set working directory
WORKDIR /usr/src/app

# Copy only package.json and tsconfig.json first
# COPY server/package*.json ./
# COPY server/tsconfig.json ./

# Install all dependencies including devDependencies
# RUN npm install

# Copy the full source code
# COPY server ./server

# Build TypeScript code (compiled into ./server/dist)
# RUN npx tsc -p ./server/tsconfig.json

# Expose the port your app uses
EXPOSE 3000

# Run the compiled server
# CMD ["node", "server/dist/index.js"]
