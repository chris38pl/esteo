"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiKeyListItem } from "@/server/integrations/keys/service";
import type { IntegrationSchemaResponse } from "@/server/integrations/schema/builder";
import {
  createIntegrationKeyAction,
  getIntegrationSchemaAction,
  listIntegrationLogsAction,
  regenerateIntegrationKeyAction,
  revokeIntegrationKeyAction,
  tryIntegrationRequestAction,
  updateIntegrationKeyAction,
} from "@/features/integrations/server/actions";
import { formatIntegrationLogReference } from "@/features/integrations/lib/format-log-reference";
import { cn } from "@/lib/utils";

type Section = "keys" | "schema" | "try" | "logs";

type LogRow = Awaited<ReturnType<typeof listIntegrationLogsAction>>[number];

type Props = {
  workspaceId: string;
  locale: string;
  enabled: boolean;
  billingPlansHref: string;
  initialKeys: ApiKeyListItem[];
  initialSchema: IntegrationSchemaResponse | null;
  initialLogs: LogRow[];
};

function buildSnippets(input: {
  baseUrl: string;
  apiKeyPlaceholder: string;
  examplePayload: string;
}) {
  const curl = `curl -X POST "${input.baseUrl}/api/v1/public/requests" \\
  -H "Authorization: Bearer ${input.apiKeyPlaceholder}" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Accept-Language: en" \\
  -F 'payload=${input.examplePayload.replace(/'/g, "'\\''")}' \\
  -F "attachments=@./photo.jpg"`;

  const fetchJs = `const form = new FormData();
form.append("payload", JSON.stringify(${input.examplePayload}));
// form.append("attachments", fileInput.files[0]);

const res = await fetch("${input.baseUrl}/api/v1/public/requests", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${input.apiKeyPlaceholder}",
    "Idempotency-Key": crypto.randomUUID(),
    "Accept-Language": "en",
  },
  body: form,
});
console.log(await res.json());`;

  const vanilla = `// Server-side only - never expose est_live_ / est_test_ in public browser JS.
${fetchJs}`;

  return { curl, fetchJs, vanilla };
}

export function WorkspaceIntegrationsPanel(props: Props) {
  const t = useTranslations("workspaces.settings.integrations");
  const [section, setSection] = useState<Section>("keys");
  const [keys, setKeys] = useState(props.initialKeys);
  const [schema, setSchema] = useState(props.initialSchema);
  const [logs, setLogs] = useState(props.initialLogs);
  const [plaintextById, setPlaintextById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("Development");
  const [newMode, setNewMode] = useState<"TEST" | "LIVE">("TEST");
  const [originsDraft, setOriginsDraft] = useState("");
  const [useTestKey, setUseTestKey] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(
    props.initialKeys.find((key) => key.mode === "TEST" && !key.revokedAt)?.id ??
      props.initialKeys.find((key) => !key.revokedAt)?.id ??
      "",
  );
  const [tryPayload, setTryPayload] = useState(
    props.initialSchema ? JSON.stringify(props.initialSchema.example, null, 2) : "{\n}\n",
  );
  const [tryFiles, setTryFiles] = useState<File[]>([]);
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [snippetKeyId, setSnippetKeyId] = useState(selectedKeyId);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://preview.esteo.app";

  const activeKeys = keys.filter((key) => !key.revokedAt);
  const snippetKey = activeKeys.find((key) => key.id === snippetKeyId) ?? activeKeys[0];
  const examplePayload = schema ? JSON.stringify(schema.example) : "{}";
  const snippets = useMemo(
    () =>
      buildSnippets({
        baseUrl,
        apiKeyPlaceholder:
          plaintextById[snippetKey?.id ?? ""] ??
          snippetKey?.keyPrefix.replace("…", "_REPLACE_ME_") ??
          "est_test_REPLACE_ME",
        examplePayload,
      }),
    [baseUrl, examplePayload, plaintextById, snippetKey],
  );

  if (!props.enabled) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold">{t("upsell.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("upsell.description")}</p>
        <Button asChild className="mt-4">
          <a href={props.billingPlansHref}>{t("upsell.cta")}</a>
        </Button>
      </div>
    );
  }

  async function refreshSchema() {
    const next = await getIntegrationSchemaAction(props.workspaceId);
    setSchema(next);
    setTryPayload(JSON.stringify(next.example, null, 2));
  }

  async function refreshLogs() {
    setLogs(await listIntegrationLogsAction(props.workspaceId));
  }

  async function onCopyPlaintext(keyId: string) {
    const value = plaintextById[keyId];
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKeyId(keyId);
      window.setTimeout(() => {
        setCopiedKeyId((current) => (current === keyId ? null : current));
      }, 2000);
    } catch {
      setError(t("errors.generic"));
    }
  }

  async function onCreateKey() {
    setBusy(true);
    setError(null);
    try {
      const origins = originsDraft
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const created = await createIntegrationKeyAction({
        workspaceId: props.workspaceId,
        name: newName,
        mode: newMode,
        allowedOrigins: origins,
      });
      setKeys((prev) => [created.key, ...prev]);
      setPlaintextById((prev) => ({ ...prev, [created.key.id]: created.plaintext }));
      setSelectedKeyId(created.key.id);
      setSnippetKeyId(created.key.id);
      setOriginsDraft("");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(keyId: string) {
    setBusy(true);
    try {
      const revoked = await revokeIntegrationKeyAction({
        workspaceId: props.workspaceId,
        keyId,
      });
      if (revoked) {
        setKeys((prev) => prev.map((key) => (key.id === keyId ? revoked : key)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRegenerate(keyId: string) {
    setBusy(true);
    try {
      const result = await regenerateIntegrationKeyAction({
        workspaceId: props.workspaceId,
        keyId,
      });
      if (result) {
        setKeys((prev) => prev.map((key) => (key.id === keyId ? result.key : key)));
        setPlaintextById((prev) => ({ ...prev, [keyId]: result.plaintext }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSaveOrigins(keyId: string, raw: string) {
    setBusy(true);
    try {
      const allowedOrigins = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const updated = await updateIntegrationKeyAction({
        workspaceId: props.workspaceId,
        keyId,
        allowedOrigins,
      });
      if (updated) {
        setKeys((prev) => prev.map((key) => (key.id === keyId ? updated : key)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onTrySubmit() {
    setBusy(true);
    setTryResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("workspaceId", props.workspaceId);
      formData.set("keyId", selectedKeyId);
      formData.set("payload", tryPayload);
      formData.set("useTestKey", useTestKey ? "true" : "false");
      formData.set("locale", props.locale);
      for (const file of tryFiles) {
        formData.append("attachments", file);
      }
      const result = await tryIntegrationRequestAction(formData);
      setTryResult(JSON.stringify(result, null, 2));
      await refreshLogs();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  const sections: Section[] = ["keys", "schema", "try", "logs"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            disabled={busy}
            onClick={() => {
              setSection(item);
              if (item === "schema" && !schema) {
                void refreshSchema();
              }
              if (item === "logs") {
                void refreshLogs();
              }
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              section === item
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`sections.${item}`)}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {section === "keys" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/70 p-4 space-y-3">
            <h3 className="font-medium">{t("keys.createTitle")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">{t("keys.name")}</Label>
                <Input
                  id="key-name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-mode">{t("keys.mode")}</Label>
                <select
                  id="key-mode"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={newMode}
                  onChange={(event) => setNewMode(event.target.value as "TEST" | "LIVE")}
                >
                  <option value="TEST">TEST (est_test_)</option>
                  <option value="LIVE">LIVE (est_live_)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="key-origins">{t("keys.origins")}</Label>
              <Textarea
                id="key-origins"
                value={originsDraft}
                onChange={(event) => setOriginsDraft(event.target.value)}
                placeholder="https://firma.pl"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("keys.originsHelp")}</p>
            </div>
            <Button type="button" disabled={busy} onClick={() => void onCreateKey()}>
              {t("keys.create")}
            </Button>
          </div>

          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  "rounded-xl border border-border/70 p-4 space-y-2",
                  key.revokedAt && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {key.mode} · {key.keyPrefix} · {key.scopes.join(", ")}
                    </p>
                  </div>
                  {!key.revokedAt ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onRegenerate(key.id)}
                      >
                        {t("keys.regenerate")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onRevoke(key.id)}
                      >
                        {t("keys.revoke")}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("keys.revoked")}</span>
                  )}
                </div>
                {plaintextById[key.id] ? (
                  <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
                    <p className="font-mono text-xs break-all">{plaintextById[key.id]}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onCopyPlaintext(key.id)}
                      >
                        {copiedKeyId === key.id ? t("keys.copied") : t("keys.copy")}
                      </Button>
                      <span className="text-[11px] text-muted-foreground">{t("keys.copyOnce")}</span>
                    </div>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("keys.createdAt")}: {new Date(key.createdAt).toLocaleString()}
                  {key.lastUsedAt
                    ? ` · ${t("keys.lastUsed")}: ${new Date(key.lastUsedAt).toLocaleString()}`
                    : ""}
                </p>
                {!key.revokedAt ? (
                  <div className="space-y-1.5">
                    <Label>{t("keys.origins")}</Label>
                    <Textarea
                      defaultValue={key.allowedOrigins.join("\n")}
                      rows={2}
                      onBlur={(event) => void onSaveOrigins(key.id, event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t("keys.originsHelp")}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 p-4 space-y-3">
            <h3 className="font-medium">{t("docs.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("docs.warning")}</p>
            <p className="text-sm text-muted-foreground">{t("docs.industryFieldsNote")}</p>
            <div className="space-y-1.5">
              <Label>{t("docs.keyForSnippets")}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={snippetKey?.id ?? ""}
                onChange={(event) => setSnippetKeyId(event.target.value)}
              >
                {activeKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} ({key.keyPrefix})
                  </option>
                ))}
              </select>
            </div>
            {(["curl", "fetchJs", "vanilla"] as const).map((kind) => (
              <div key={kind} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t(`docs.${kind}`)}
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  {snippets[kind]}
                </pre>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {section === "schema" ? (
        <div className="space-y-4">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void refreshSchema()}>
            {t("schema.refresh")}
          </Button>
          {schema ? (
            <>
              <div>
                <h3 className="mb-2 font-medium">{t("schema.example")}</h3>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(schema.example, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 font-medium">{t("schema.fields")}</h3>
                <p className="mb-2 text-xs text-muted-foreground">{t("schema.fieldsHelp")}</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(schema.fields, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 font-medium">{t("schema.limits")}</h3>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(schema.limits, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 font-medium">{t("schema.schema")}</h3>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(schema.schema, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {section === "try" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("try.requestOnlyNote")}</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useTestKey}
              onChange={(event) => setUseTestKey(event.target.checked)}
            />
            {t("try.useTestKey")}
          </label>
          <div className="space-y-1.5">
            <Label>{t("try.key")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedKeyId}
              onChange={(event) => setSelectedKeyId(event.target.value)}
            >
              {activeKeys
                .filter((key) => (useTestKey ? key.mode === "TEST" : true))
                .map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} ({key.keyPrefix})
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("try.payload")}</Label>
            <Textarea
              value={tryPayload}
              onChange={(event) => setTryPayload(event.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("try.attachments")}</Label>
            <Input
              type="file"
              multiple
              onChange={(event) => setTryFiles(Array.from(event.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">{t("try.attachmentsHelp")}</p>
          </div>
          <Button type="button" disabled={busy || !selectedKeyId} onClick={() => void onTrySubmit()}>
            {t("try.submit")}
          </Button>
          {tryResult ? (
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{tryResult}</pre>
          ) : null}
        </div>
      ) : null}

      {section === "logs" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("logs.help")}</p>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void refreshLogs()}>
            {t("logs.refresh")}
          </Button>
          {logs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("logs.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("logs.time")}</th>
                    <th className="px-3 py-2">{t("logs.status")}</th>
                    <th className="px-3 py-2">{t("logs.method")}</th>
                    <th className="px-3 py-2">{t("logs.path")}</th>
                    <th className="px-3 py-2">{t("logs.reference")}</th>
                    <th className="px-3 py-2">{t("logs.duration")}</th>
                    <th className="px-3 py-2">{t("logs.requestId")}</th>
                    <th className="px-3 py-2">{t("logs.error")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-border/60">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString(props.locale)}
                      </td>
                      <td className="px-3 py-2">{log.statusCode}</td>
                      <td className="px-3 py-2">{log.method}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.path}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {formatIntegrationLogReference(log.reference) ?? "-"}
                      </td>
                      <td className="px-3 py-2">{log.durationMs} ms</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.httpRequestId}</td>
                      <td className="px-3 py-2 text-xs">
                        {log.errorSummary
                          ? `${log.errorCode ?? "ERROR"}: ${log.errorSummary}`
                          : (log.errorCode ?? "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
