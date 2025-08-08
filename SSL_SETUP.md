# SSL Certificate Setup Guide

Инструкция по настройке бесплатных SSL сертификатов Let's Encrypt для VPN Manager приложения.

## Предварительные требования

1. **Домен**: У вас должен быть собственный домен (например, `vpn.example.com`)
2. **DNS настройка**: Ваш домен должен указывать на IP сервера где будет развернуто приложение
3. **Открытые порты**: Порты 80 и 443 должны быть открыты и доступны из интернета
4. **Docker**: Docker и Docker Compose должны быть установлены на сервере

## Пошаговая инструкция

### 1. Подготовка домена

Убедитесь что ваш домен указывает на IP сервера:
```bash
# Проверить DNS запись
dig +short vpn.example.com
nslookup vpn.example.com
```

### 2. Получение SSL сертификата

Запустите скрипт для получения сертификата:
```bash
# Замените на ваш домен и email
./get-ssl-cert.sh vpn.example.com admin@example.com
```

**Что делает скрипт:**
- Обновляет конфигурацию nginx с вашим доменом
- Запускает временный веб-сервер для валидации домена
- Запрашивает сертификат у Let's Encrypt
- Настраивает правильные разрешения файлов

### 3. Запуск приложения с HTTPS

После успешного получения сертификата:
```bash
# Запустить приложение в продакшен режиме с HTTPS
docker-compose -f docker-compose.prod.yml up -d
```

Приложение будет доступно по адресу: `https://vpn.example.com`

### 4. Проверка работы SSL

Проверить что сертификат работает:
```bash
# Проверить сертификат
curl -I https://vpn.example.com

# Проверить редирект с HTTP на HTTPS
curl -I http://vpn.example.com
```

### 5. Настройка автоматического обновления

Сертификаты Let's Encrypt действительны 90 дней. Настройте автоматическое обновление:

#### Вариант 1: Cron задача
```bash
# Добавить в crontab (обновление каждые 60 дней в 3:00)
crontab -e

# Добавить строку:
0 3 */60 * * cd /path/to/your/project && ./renew-ssl-cert.sh >> /var/log/ssl-renewal.log 2>&1
```

#### Вариант 2: Systemd timer
```bash
# Создать systemd service
sudo tee /etc/systemd/system/ssl-renewal.service << EOF
[Unit]
Description=Renew SSL certificates
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/your/project
ExecStart=/path/to/your/project/renew-ssl-cert.sh
User=your-user
EOF

# Создать systemd timer
sudo tee /etc/systemd/system/ssl-renewal.timer << EOF
[Unit]
Description=Run SSL renewal every 60 days
Requires=ssl-renewal.service

[Timer]
OnCalendar=*-*-1,15 03:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Включить timer
sudo systemctl enable ssl-renewal.timer
sudo systemctl start ssl-renewal.timer
```

## Ручное обновление сертификатов

Если нужно обновить сертификат вручную:
```bash
./renew-ssl-cert.sh
```

## Устранение неисправностей

### Ошибка "Domain validation failed"

1. **Проверьте DNS записи:**
   ```bash
   dig +short your-domain.com
   ```

2. **Проверьте что порт 80 открыт:**
   ```bash
   sudo netstat -tlnp | grep :80
   curl -I http://your-domain.com/.well-known/acme-challenge/
   ```

3. **Проверьте файрволл:**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```

### Ошибка "Certificate files not found"

Проверьте что сертификат был создан:
```bash
ls -la ./nginx/ssl/live/your-domain.com/
```

### Nginx не запускается после добавления SSL

1. **Проверьте синтаксис конфигурации:**
   ```bash
   docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx nginx -t
   ```

2. **Проверьте права доступа к сертификатам:**
   ```bash
   ls -la ./nginx/ssl/live/your-domain.com/
   ```

## Безопасность

1. **Файлы сертификатов содержат приватные ключи** - не делитесь ими и не добавляйте в git
2. **Добавьте в .gitignore:**
   ```bash
   echo "nginx/ssl/" >> .gitignore
   echo "certbot/" >> .gitignore
   ```

3. **Регулярно обновляйте сертификаты** - они действительны только 90 дней

## Структура SSL файлов

После получения сертификата у вас будет:
```
nginx/ssl/
├── live/your-domain.com/
│   ├── cert.pem         # Сертификат сайта
│   ├── chain.pem        # Промежуточный сертификат
│   ├── fullchain.pem    # cert.pem + chain.pem
│   └── privkey.pem      # Приватный ключ
└── archive/your-domain.com/
    └── [numbered cert files]
```

## Мониторинг сертификатов

Проверить срок действия сертификата:
```bash
openssl x509 -in ./nginx/ssl/live/your-domain.com/fullchain.pem -noout -dates
```

Получить информацию о сертификате в браузере или через команду:
```bash
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

**Поздравляем!** 🎉 Ваше VPN Manager приложение теперь защищено SSL сертификатом и доступно по HTTPS.