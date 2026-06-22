FROM node:18

# instalar gcc
RUN apt-get update && apt-get install -y gcc build-essential

# crear directorio de trabajo
WORKDIR /app

# copiar package.json e instalar dependencias
COPY package.json .
RUN npm install

# copiar el resto de archivos
COPY . .

# exponer puerto
EXPOSE 3000

# iniciar servidor
CMD ["node", "servidor.js"]