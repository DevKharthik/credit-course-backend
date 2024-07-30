# Use the official Node.js image from the Docker Hub
FROM node:14

# Create a directory for the application
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that your application will run on
EXPOSE 3005

# Command to run the application
CMD ["node", "server.js"]
