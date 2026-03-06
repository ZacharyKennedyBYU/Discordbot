# Cordbot

A lightweight Discord bot that connects to OpenRouter models (like DeepSeek) with easily configurable prompts and parameters.

## Setup Instructions

1. **Configure Environment Variables**
   - Copy `.env.example` to a new file named `.env`
   - Fill in your `DISCORD_TOKEN` and `OPENROUTER_API_KEY` in the `.env` file.

2. **Configure Your Bot (config.json)**
   - `model`: The OpenRouter model ID (e.g., `deepseek/deepseek-chat`).
   - `system_prompt`: The core instructions for the bot.
   - `character_prompt`: The personality or style of the bot.
   - `prefill`: A starting response that the bot will build upon (leave empty string `""` if not needed).
   - `model_params`: Tweak token count, temperature, top_p, etc.

3. **Discord Bot Setup**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Create a new application and add a Bot to it.
   - **Important**: Under the "Bot" tab, scroll down to "Privileged Gateway Intents" and enable **Message Content Intent**. If this is not enabled, the bot cannot read your messages!
   - Copy the bot token and paste it into `.env`.
   - Invite the bot to your server using the OAuth2 URL Generator (check the `bot` scope and required text permissions like `Send Messages`).

4. **Run the Bot**
   Start the bot by running:
   ```bash
   node index.js
   ```

## Usage
Simply `@mention` the bot in any channel it has access to, or send it a Direct Message.
