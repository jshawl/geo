FROM amazon/aws-cli:2.32.6
RUN dnf update -y 
RUN dnf install -y sqlite
WORKDIR /app
COPY . .

ENTRYPOINT ["/app/backup.sh"]
