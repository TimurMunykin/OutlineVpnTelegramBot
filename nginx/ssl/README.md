# SSL Certificates

Place your SSL certificates in this directory:

- `cert.pem` - SSL certificate
- `key.pem` - Private key

## Generating Self-Signed Certificates (for testing)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Using Let's Encrypt (recommended for production)

```bash
# Install certbot
sudo apt install certbot

# Get certificate (replace your-domain.com)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
```

## Enabling HTTPS

After placing certificates, uncomment the HTTPS server block in `nginx/nginx.conf` and restart:

```bash
docker-compose -f docker-compose.prod.yml restart frontend
```