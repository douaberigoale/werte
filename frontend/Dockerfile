FROM node:20-slim

WORKDIR /app

# Copy package files and registry config
COPY package*.json .npmrc* ./

# Install dependencies (use public registry explicitly)
RUN npm install --registry https://registry.npmjs.org/ --no-audit

# Copy project files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
