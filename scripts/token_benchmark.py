import tiktoken

def count_tokens(text, encoding_name="cl100k_base"):
    encoding = tiktoken.get_encoding(encoding_name)
    return len(encoding.encode(text))

data = [
    ("resolveInlineButtonsScopeFromCapabilities", "resBtnScope"),
    ("dispatchInboundMessageWithBufferedDispatcher", "dispatchMsg"),
    ("consumeGatewaySigusr1RestartAuthorization", "authRestart"),
    ("appendAssistantMessageToSessionTranscript", "addTranscript"),
    ("calculateAuthProfileBillingDisableMsWithConfig", "calcBilling"),
    ("TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS", "TG_TEXT_MIN"),
    ("DISCORD_APP_FLAG_GATEWAY_MESSAGE_CONTENT_LIMITED", "DC_MSG_LMT"),
]

print(f"{'Long Name':<50} | {'Short Name':<15} | {'L Tok':<5} | {'S Tok':<5} | {'Savings'}")
print("-" * 95)

for long_name, short_name in data:
    l_tokens = count_tokens(long_name)
    s_tokens = count_tokens(short_name)
    savings = (1 - s_tokens / l_tokens) * 100 if l_tokens > 0 else 0
    print(f"{long_name:<50} | {short_name:<15} | {l_tokens:<5} | {s_tokens:<5} | {savings:>6.1f}%")
