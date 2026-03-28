import {
  DEFAULT_APPEARANCE,
  DEFAULT_INSTANCE_BINDING,
  DEFAULT_STATS,
  type BindingDuty,
  type MiiCharacter,
  type MiiInstanceBinding,
  type Personality,
} from "@/lib/mii-types";

const DUTY_FALLBACK: BindingDuty = "支援";

function normalizeBindings(
  bindings: unknown,
  legacyPrimaryId?: string
): MiiInstanceBinding[] {
  const rawBindings = Array.isArray(bindings) ? bindings : [];
  const normalized = rawBindings
    .filter(
      (
        binding
      ): binding is Partial<MiiInstanceBinding> & { instanceId: string } =>
        Boolean(binding && typeof binding === "object" && (binding as { instanceId?: unknown }).instanceId)
    )
    .map((binding) => ({
      instanceId: binding.instanceId,
      mode: binding.mode === "primary" ? "primary" : DEFAULT_INSTANCE_BINDING.mode,
      duty: (binding.duty as BindingDuty) || DUTY_FALLBACK,
      label: typeof binding.label === "string" ? binding.label : undefined,
      autoLaunch: Boolean(binding.autoLaunch),
    }));

  if (legacyPrimaryId && !normalized.some((binding) => binding.instanceId === legacyPrimaryId)) {
    normalized.unshift({
      instanceId: legacyPrimaryId,
      mode: "primary",
      duty: "主控",
      label: "主控实例",
      autoLaunch: true,
    });
  }

  const seen = new Set<string>();
  const deduped = normalized.filter((binding) => {
    if (seen.has(binding.instanceId)) return false;
    seen.add(binding.instanceId);
    return true;
  });

  let primaryAssigned = false;
  return deduped.map((binding, index) => {
    const nextMode = !primaryAssigned && (binding.mode === "primary" || index === 0 && binding.instanceId === legacyPrimaryId)
      ? "primary"
      : "secondary";

    if (nextMode === "primary") primaryAssigned = true;

    return {
      ...binding,
      mode: nextMode,
      duty: binding.duty || (nextMode === "primary" ? "主控" : DUTY_FALLBACK),
      autoLaunch: binding.autoLaunch ?? false,
    };
  });
}

export function normalizeCharacter(input: Partial<MiiCharacter>): MiiCharacter {
  const now = new Date().toISOString();
  const legacyPrimaryId = input.primaryInstanceId || input.dockerInstanceId;
  const instanceBindings = normalizeBindings(input.instanceBindings, legacyPrimaryId);
  const primaryBinding =
    instanceBindings.find((binding) => binding.mode === "primary") ?? instanceBindings[0];
  const personality = Array.from(
    new Set((input.personality || ["友善"]) as Personality[])
  ).slice(0, 3);

  return {
    id: input.id || crypto.randomUUID(),
    name: input.name?.trim() || "未命名角色",
    avatar: {
      ...DEFAULT_APPEARANCE,
      ...(input.avatar || {}),
    },
    personality,
    role: input.role || "工程师",
    description: input.description || "",
    dockerInstanceId: primaryBinding?.instanceId,
    primaryInstanceId: primaryBinding?.instanceId,
    instanceBindings,
    stats: {
      ...DEFAULT_STATS,
      ...(input.stats || {}),
    },
    status: input.status || "offline",
    ...(input.backstory !== undefined ? { backstory: input.backstory } : {}),
    ...(input.catchphrase !== undefined ? { catchphrase: input.catchphrase } : {}),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function getCharacterBindings(character: MiiCharacter): MiiInstanceBinding[] {
  return normalizeCharacter(character).instanceBindings;
}

export function getPrimaryBinding(character: MiiCharacter): MiiInstanceBinding | undefined {
  return getCharacterBindings(character).find((binding) => binding.mode === "primary");
}

export function setPrimaryInstance(
  character: MiiCharacter,
  instanceId?: string
): MiiCharacter {
  const normalized = normalizeCharacter(character);
  const secondaryBindings = normalized.instanceBindings.filter(
    (binding) => binding.instanceId !== instanceId
  );

  const nextBindings = instanceId
    ? [
        {
          instanceId,
          mode: "primary" as const,
          duty: "主控" as const,
          label: "主控实例",
          autoLaunch: true,
        },
        ...secondaryBindings.filter((binding) => binding.instanceId !== instanceId),
      ]
    : secondaryBindings.filter((binding) => binding.mode !== "primary");

  return normalizeCharacter({
    ...normalized,
    primaryInstanceId: instanceId,
    dockerInstanceId: instanceId,
    instanceBindings: nextBindings,
    updatedAt: new Date().toISOString(),
  });
}
