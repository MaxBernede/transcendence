FROM dpage/pgadmin4




# in the installation process of pgadmin, there was an issue with the logs
# I decided to fix it using the next lines, just creating it manually
USER root

RUN mkdir /var/log/pgadmin

RUN touch /var/log/pgadmin/pgadmin4.log

RUN chmod 777 /var/log/pgadmin/pgadmin4.log

USER pgadmin