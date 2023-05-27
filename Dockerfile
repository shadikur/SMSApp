# Specify the base image
FROM node:14


WORKDIR /app


RUN git clone https://github.com/shadikur/SMSApp.git .


RUN npm install


EXPOSE 8085

CMD ["node", "index.js"]
