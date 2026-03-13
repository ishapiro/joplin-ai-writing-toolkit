#!/bin/bash

# Update package lists
sudo apt update

# 1. Install standard high-performance alternatives
# ripgrep (rg), fd-find (fd), and bat
sudo apt install -y ripgrep fd-find bat zoxide

# Note: On Ubuntu, 'fd' is installed as 'fdfind' and 'bat' as 'batcat'.
# Let's create aliases so Claude (and you) can use the standard names.
mkdir -p ~/.local/bin
ln -s $(which fdfind) ~/.local/bin/fd 2>/dev/null
ln -s $(which batcat) ~/.local/bin/bat 2>/dev/null

# 2. Install Eza (modern ls)
sudo mkdir -p /etc/apt/keyrings
wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg
echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list
sudo apt update
sudo apt install -y eza

# 3. Install Lazygit
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit
sudo install lazygit /usr/local/bin
rm lazygit.tar.gz lazygit

# 4. Add Zoxide and Local Bin to your shell config
if ! grep -q "zoxide" ~/.bashrc; then
    echo 'eval "$(zoxide init bash)"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "--- Installation Complete ---"
echo "Please run 'source ~/.bashrc' to activate the changes."