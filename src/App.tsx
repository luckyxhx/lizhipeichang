import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { resolveAccess } from "@/lib/access";
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
  const access = useMemo(
    () =>
      resolveAccess(
        window.location.search,
        import.meta.env.VITE_ALLOWED_TOKENS,
        import.meta.env.VITE_PAID_TOKENS,
      ),
    [],
  );

  if (!access.authorized) {
    return (
      <AppShell>
        <Unauthorized tokenConfigured={access.tokenConfigured} />
      </AppShell>
    );
  }

  if (screen === "result" && calculation) {
    return (
      <AppShell>
        <Result
          input={calculation.input}
          result={calculation.result}
          edition={access.edition}
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
        <Home
          edition={access.edition}
          expiresAt={access.expiresAt}
          onStart={() => setScreen("wizard")}
        />
      ) : (
        <Wizard
          edition={access.edition}
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
