FROM node:lts-alpine
LABEL author Dylan van den Brink

RUN apk add apk-cron

COPY main.js /funda-notifier/main.js
COPY config.yml /funda-notifier/
COPY package*.json /funda-notifier/
COPY funda-notify-cron /etc/cron.d/funda-notify-cron

WORKDIR /funda-notifier

RUN npm install

RUN chmod 0644 /etc/cron.d/funda-notify-cron
RUN /usr/bin/crontab /etc/cron.d/funda-notify-cron
RUN touch /var/log/cron.log
RUN mkdir data

CMD /usr/sbin/crond -f -l 8 && tail -f /var/log/cron.log
