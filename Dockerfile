# Use latest Node.js
FROM node:latest

# Set working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Delete node_modules if it exists
RUN rm -rf node_modules

# Install dependencies
RUN yarn

# Copy the rest of the files to the working directory
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["yarn", "dev"]
