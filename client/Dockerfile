FROM node:26

WORKDIR /frontend

EXPOSE 5173

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
