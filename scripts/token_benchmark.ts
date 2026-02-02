import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("gpt-4"); // gpt-4 uses cl100k_base, same as Claude 3

const samples = [
    { long: "resolveInlineButtonsScopeFromCapabilities", short: "resBtnScope" },
    { long: "dispatchInboundMessageWithBufferedDispatcher", short: "dispatchMsg" },
    { long: "consumeGatewaySigusr1RestartAuthorization", short: "authRestart" },
    { long: "appendAssistantMessageToSessionTranscript", short: "addTranscript" },
    { long: "calculateAuthProfileBillingDisableMsWithConfig", short: "calcBilling" },
    { long: "TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS", short: "TG_TEXT_MIN" },
    { long: "DISCORD_APP_FLAG_GATEWAY_MESSAGE_CONTENT_LIMITED", short: "DC_MSG_LMT" },
];

console.log("| Original Name | Tokens | Shortened Name | Tokens | Savings |");
console.log("|---------------|--------|----------------|--------|---------|");

samples.forEach(({ long, short }) => {
    const tLong = enc.encode(long).length;
    const tShort = enc.encode(short).length;
    const savings = ((tLong - tShort) / tLong * 100).toFixed(1) + "%";
    console.log(`| ${long} | ${tLong} | ${short} | ${tShort} | ${savings} |`);
});

enc.free();
