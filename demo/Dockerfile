# 使用 nginx 来提供静态文件内容
FROM nginx:alpine
# 移除原来默认的静态文件
RUN rm -rf /usr/share/nginx/html/*
# 复制新的静态文件至当下目录位置
COPY . /usr/share/nginx/html
# 开启端口 80
EXPOSE 80
# 执行 nginx
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]