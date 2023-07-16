import type { Bot } from "@wwyb/core";
import { useStore } from "zustand";
import { config } from "~/config";
import { useAction } from "~/hooks/useAction";
import { useGameStore } from "~/store";

export function BotsScreen() {
  const store = useGameStore();
  const [bots, createBotHandler, deleteBotHandler] = useStore(
    store,
    (state) => [state.bots, state.createBot, state.deleteBot]
  );
  const createBot = useAction<string, Bot>(createBotHandler);
  const deleteBot = useAction<string, Bot>(deleteBotHandler);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    createBot.set(name);
  }

  function handleBotCreation() {
    createBot.submit();
  }

  function handleEnterButton(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      createBot.submit();
    }
  }

  const hasReachedBotLimit = bots.length >= config.maxBotsPerPlayer;

  return (
    <div>
      <div className="join">
        <input
          value={createBot.value || ""}
          onChange={handleInputChange}
          onKeyDown={handleEnterButton}
          className={`input-bordered input join-item ${
            createBot?.error ? "input-error" : ""
          }`}
          placeholder="Bot name"
        />
        <div
          className={hasReachedBotLimit ? "tooltip" : ""}
          data-tip={hasReachedBotLimit ? "Max 3 bots allowed per player" : ""}
        >
          <button
            onClick={handleBotCreation}
            disabled={!!createBot?.error || hasReachedBotLimit}
            className={`btn-primary join-item btn rounded-r-full ${
              createBot.submitting ? "loading loading-spinner" : ""
            }`}
          >
            Create bot
          </button>
        </div>
      </div>
      <small className="text-error">{createBot?.error}</small>
      {bots.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Read the{" "}
          <a className="link" href="https://www.whywouldyoubot.gg/docs">
            documentation
          </a>{" "}
          on how to develop your own bot.
        </div>
      )}

      <div className="divider"></div>
      <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
        {bots.length === 0 ? (
          <div className="text-center text-sm text-gray-500">
            You don't have any bots yet 🤖
          </div>
        ) : (
          bots.map((bot) => (
            <div key={bot.id} className="mb-3 flex justify-between">
              <div>
                <p className="font-semibold leading-snug">{bot.name}</p>
                <span className="text-sm text-gray-400">API Key: </span>
                <span className="text-sm">{bot.apiKey}</span>
              </div>
              <button
                className={`btn-circle btn text-error ${
                  createBot.submitting ? "loading loading-spinner" : ""
                }`}
                onClick={() => deleteBot.submit(bot.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
