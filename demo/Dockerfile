# 使用 nginx 来提供静态文件内容
FROM nginx:alpine
# 切换静态文件所在的目录位置
WORKDIR /usr/share/nginx/html
# 移除原来默认的静态文件
RUN rm -rf ./*
# 复制新的静态文件至当下目录位置
COPY /app/demo .
# 开启端口 80
EXPOSE 80
# 执行 nginx
ENTRYPOINT ["nginx", "-g", "daemon off;"]