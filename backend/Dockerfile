FROM golang:1.26.2

WORKDIR /app

COPY . .

RUN go build -o build/app .

EXPOSE 8000
CMD ["./build/app"]