# Deploying to GCP VM (Compute Engine)

Since you are using a Virtual Private Server (VPS) like GCP Compute Engine (or AWS EC2), you have full control. This guide helps you deploy your app so that:
1.  Frontend & Backend run as **one service** (simplest management).
2.  Data is saved persistently to the VM's disk.
3.  The app auto-restarts if the server reboots.

---

## 1. Prepare Your VM
Login to your GCP VM via SSH (Google Cloud Console > Compute Engine > SSH).

**Update and install Node.js:**
```bash
# Update package list
sudo apt update

# Install Node.js (Version 20.x recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v

# Install Git (usually installed, but just in case)
sudo apt install -y git
```

---

## 2. Deploy Code
**Clone your project:**
```bash
# Navigate to a good folder (e.g. home)
cd ~

# A. If using GitHub:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git performance-app

# B. If uploading manually (SCP/SFTP):
# Just upload your project folder to ~/performance-app
```

**Install & Build:**
```bash
cd performance-app

# Install dependencies
npm install

# Build the frontend (Vite -> dist folder)
npm run build
```
> *Note: If `npm run build` fails due to RAM, try `NODE_OPTIONS="--max-old-space-size=4096" npm run build` or build locally and upload the `dist` folder.*

---

## 3. Run with Process Manager (PM2)
We use `pm2` to keep your app running in the background 24/7.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server
# NAME: "performx-app", SCRIPT: "server.js"
pm2 start server.js --name "performx-app"

# Save list so it restarts on reboot
pm2 save
pm2 startup
# (Run the command output by 'pm2 startup' to finalize)
```

**Check status:**
```bash
pm2 status
pm2 logs
```

---

## 4. Firewall & Access
By default, your app runs on port **3001**.
You need to open this port in GCP Firewall rules, or redirect port 80 (HTTP) to 3001.

### Option A: Open Port 3001 (Easiest for testing)
1.  Go to GCP Console > VPC Network > Firewall.
2.  Create Rule: "allow-3001"
3.  Targets: "All instances in the network"
4.  Source filter: "0.0.0.0/0" (Allow all IP)
5.  Protocols/ports: `tcp:3001`
6.  **Access App:** `http://YOUR_VM_EXTERNAL_IP:3001`

### Option B: Port Forwarding 80 -> 3001 (Better UX)
Run this command on your VM to forward HTTP traffic to your Node app:
```bash
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3001
```
*Note: This is temporary. For permanent production, using Nginx or a Load Balancer is recommended, but this works for quick demos.*

---

## 5. Updates & Maintenance
To update your app later:
```bash
cd ~/performance-app
git pull            # Get latest code
npm install         # If packages changed
npm run build       # Rebuild frontend
pm2 restart all     # Restart server
```
