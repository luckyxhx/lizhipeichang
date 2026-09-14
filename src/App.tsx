import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { getTokenFromSearch, isTokenAllowed } from "@/lib/access";
import { Home } from "@/pages/Home";
import { Result } from "@/pages/Result";
import { Unauthorized } from "@/pages/Unauthorized";
import { Wizard } from "@/pages/Wizard";
import type { CalculationInput, CalculationResult } from "@/types";

export const App = (): JSX.Element => {
  const [screen, setScreen] = useState<"home" | "wizard" | "result">("home");
  const [calculation, setCalculation] = useState<{
    input: CalculationInput;
    result: CalculationResult;
  } | null>(null);
  const token = useMemo(() => getTokenFromSearch(window.location.search), []);
  const allowedTokens = import.meta.env.VITE_ALLOWED_TOKENS;
  const authorized = isTokenAllowed(token, allowedTokens);

  if (!authorized) {
    return (
      <AppShell>
        <Unauthorized tokenConfigured={Boolean(allowedTokens?.trim())} />
      </AppShell>
    );
  }

  if (screen === "result" && calculation) {
    return (
      <AppShell>
        <Result
          input={calculation.input}
          result={calculation.result}
          onEdit={() => setScreen("wizard")}
          onRestart={() => {
            setCalculation(null);
            setScreen("wizard");
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {screen === "home" ? (
        <Home onStart={() => setScreen("wizard")} />
      ) : (
        <Wizard
          initialValues={calculation?.input}
          onBackHome={() => setScreen("home")}
          onComplete={(input, result) => {
            setCalculation({ input, result });
            setScreen("result");
          }}
        />
      )}
    </AppShell>
  );
};
