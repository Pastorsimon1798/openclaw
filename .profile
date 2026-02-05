# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.
# see /usr/share/doc/bash/examples/startup-files for examples.
# the files are located in the bash-doc package.

# the default umask is set in /etc/profile; for setting the umask
# for ssh logins, install and configure the libpam-umask package.
#umask 022

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi

# GOG (Google Workspace CLI) configuration
export GOG_KEYRING_BACKEND="file"
export GOG_ACCOUNT="clawdbot@puenteworks.com"

# Load Liam system secrets (ZAI_API_KEY, Slack tokens, GOG_KEYRING_PASSWORD)
if [ -f "$HOME/.clawdbot/credentials/liam.env" ]; then
    set -a; source "$HOME/.clawdbot/credentials/liam.env"; set +a
fi

. "$HOME/.cargo/env"
# Secrets are now loaded from ~/.clawdbot/credentials/liam.env (sourced above)

# Keep models loaded in memory for 24h (no reload delay)
export OLLAMA_KEEP_ALIVE=24h

# Allow multiple concurrent model requests
export OLLAMA_NUM_PARALLEL=4

# Keep multiple models loaded (78GB RAM available)
export OLLAMA_MAX_LOADED_MODELS=1
# MOONSHOT_API_KEY and KIMI_API_KEY loaded from ~/.clawdbot/credentials/liam.env (sourced above)