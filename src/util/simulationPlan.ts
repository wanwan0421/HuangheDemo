import type {
  SimulationPlan,
  SimulationPlanAlternativeModel,
  SimulationPlanInputSlot,
  SimulationPlanResultOutput,
  WorkflowInput,
  WorkflowState,
} from "../types";

type UnknownRecord = Record<string, unknown>;

const nowIso = () => new Date().toISOString();

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readString = (
  record: UnknownRecord | null | undefined,
  keys: string[],
  fallback = "",
) => {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return fallback;
};

const readArray = (record: UnknownRecord | null | undefined, key: string) => {
  const value = record?.[key];
  return Array.isArray(value) ? value : [];
};

const isPlanStatus = (value: string): value is SimulationPlan["status"] => {
  return ["drafting", "ready", "running", "done", "failed"].includes(value);
};

const normalizeParameterValues = (
  value: UnknownRecord,
): SimulationPlan["parameters"]["values"] => {
  return Object.entries(value).reduce<SimulationPlan["parameters"]["values"]>((acc, [key, item]) => {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      acc[key] = item;
    }
    return acc;
  }, {});
};

const getInputKind = (inputType?: string): SimulationPlanInputSlot["kind"] => {
  const normalized = String(inputType || "").toLowerCase();
  if (normalized.includes("file") || normalized.includes("raster") || normalized.includes("vector")) {
    return "file";
  }
  if (normalized.includes("int") || normalized.includes("float") || normalized.includes("double") || normalized.includes("number")) {
    return "number";
  }
  if (normalized.includes("param")) {
    return "parameter";
  }
  return "text";
};

export const makeSimulationSlotId = (
  stateName: string,
  eventName: string,
  inputName: string,
) => `${stateName}@@@${eventName}@@@${inputName}`;

export const createInitialSimulationPlan = (objective = ""): SimulationPlan => {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    title: objective ? objective.slice(0, 36) : "未命名模拟方案",
    createdAt: timestamp,
    updatedAt: timestamp,
    status: objective ? "drafting" : "drafting",
    goal: {
      objective,
      studyArea: "",
      timeHorizon: "",
      assumptions: ["使用模型默认参数作为初始值", "数据缺口先用占位项标注"],
      successCriteria: ["运行完成后可查看结果文件和地图预览"],
    },
    model: {
      recommendedName: null,
      description: "",
      alternatives: [],
      contract: null,
      workflow: [],
    },
    data: {
      slots: [],
      notes: "",
    },
    parameters: {
      values: {},
      notes: "参数会随模型工作流自动生成，可在运行前修改。",
    },
    result: {
      taskId: null,
      status: "idle",
      raw: null,
      error: null,
      outputs: [],
    },
    agentNotes: "",
  };
};

export const buildSlotsFromWorkflow = (
  workflow: WorkflowState[],
  existingSlots: SimulationPlanInputSlot[] = [],
) => {
  const previousByName = new Map(existingSlots.map((slot) => [slot.name, slot]));
  const previousById = new Map(existingSlots.map((slot) => [slot.id, slot]));
  const slots: SimulationPlanInputSlot[] = [];

  workflow.forEach((state) => {
    state.events.forEach((event) => {
      event.inputs.forEach((input: WorkflowInput) => {
        const id = makeSimulationSlotId(state.stateName, event.eventName, input.name);
        const previous = previousById.get(id) || previousByName.get(input.name);
        slots.push({
          id,
          name: input.name,
          type: input.type || "TEXT",
          kind: getInputKind(input.type),
          description: input.description || event.eventDescription || "",
          required: true,
          value: previous?.value ?? null,
          fileName: previous?.fileName,
          source: `${state.stateName} / ${event.eventName}`,
        });
      });
    });
  });

  return slots;
};

export const getPlanParameterValuesFromSlots = (
  slots: SimulationPlanInputSlot[],
  previousValues: SimulationPlan["parameters"]["values"] = {},
) => {
  return slots.reduce<SimulationPlan["parameters"]["values"]>((acc, slot) => {
    if (slot.kind === "file") return acc;
    acc[slot.name] = previousValues[slot.name] ?? slot.value ?? null;
    return acc;
  }, {});
};

export const mergeTaskSpecIntoPlan = (
  plan: SimulationPlan,
  taskSpec: unknown,
): SimulationPlan => {
  const spec = isRecord(taskSpec) ? taskSpec : {};
  const objective =
    readString(spec, ["objective", "task", "goal", "query"], plan.goal.objective);
  const studyArea =
    readString(spec, ["study_area", "studyArea", "region"], plan.goal.studyArea);
  const timeHorizon =
    readString(spec, ["time_horizon", "timeHorizon", "period"], plan.goal.timeHorizon);
  const assumptions =
    Array.isArray(spec.assumptions) && spec.assumptions.length > 0
      ? spec.assumptions.map(String)
      : plan.goal.assumptions;

  return touchPlan({
    ...plan,
    title: objective ? String(objective).slice(0, 36) : plan.title,
    goal: {
      ...plan.goal,
      objective: String(objective || ""),
      studyArea: String(studyArea || ""),
      timeHorizon: String(timeHorizon || ""),
      assumptions,
    },
    agentNotes: readString(spec, ["summary", "description"], plan.agentNotes),
  });
};

export const mergeModelContractIntoPlan = (
  plan: SimulationPlan,
  contract: unknown,
): SimulationPlan => {
  const contractRecord = isRecord(contract) ? contract : null;
  const contractSlots = Array.isArray(contractRecord?.Required_slots)
    ? contractRecord.Required_slots
    : Array.isArray(contract)
      ? contract
      : [];

  const existingByName = new Map(plan.data.slots.map((slot) => [slot.name, slot]));
  const slotsFromContract = contractSlots.map((slotValue, index: number) => {
    const slot = isRecord(slotValue) ? slotValue : {};
    const name = readString(slot, ["Input_name", "slot_name", "name"], `slot_${index + 1}`);
    const previous = existingByName.get(name);
    const type = readString(slot, ["type", "Data_type", "data_type"], previous?.type || "FILE");
    return {
      id: previous?.id || `contract@@@${name}`,
      name,
      type,
      kind: getInputKind(type),
      description:
        readString(slot, ["Semantic_requirement", "semantic_requirement", "description"], previous?.description || ""),
      required: true,
      value: previous?.value ?? null,
      fileName: previous?.fileName,
      source: previous?.source || "Model contract",
    } satisfies SimulationPlanInputSlot;
  });

  const slots = plan.data.slots.length > 0 ? plan.data.slots : slotsFromContract;

  return touchPlan({
    ...plan,
    model: {
      ...plan.model,
      contract,
    },
    data: {
      ...plan.data,
      slots,
    },
    parameters: {
      ...plan.parameters,
      values: getPlanParameterValuesFromSlots(slots, plan.parameters.values),
    },
  });
};

export const mergeRecommendedModelIntoPlan = (
  plan: SimulationPlan,
  modelPayload: unknown,
): SimulationPlan => {
  const payload = isRecord(modelPayload) ? modelPayload : {};
  const workflow = Array.isArray(payload.workflow) ? payload.workflow as WorkflowState[] : plan.model.workflow;
  const slots = buildSlotsFromWorkflow(workflow, plan.data.slots);
  const alternatives = normalizeAlternatives(payload.alternatives || payload.candidate_models || plan.model.alternatives);

  return touchPlan({
    ...plan,
    status: "ready",
    model: {
      ...plan.model,
      recommendedName: readString(payload, ["name", "modelName"], plan.model.recommendedName || "") || plan.model.recommendedName,
      description: readString(payload, ["description", "desc"], plan.model.description),
      alternatives,
      workflow,
    },
    data: {
      ...plan.data,
      slots,
    },
    parameters: {
      ...plan.parameters,
      values: getPlanParameterValuesFromSlots(slots, plan.parameters.values),
    },
  });
};

export const normalizePlanDraft = (
  draft: unknown,
  previousPlan: SimulationPlan,
): SimulationPlan => {
  const draftRecord = isRecord(draft) ? draft : {};
  const modelRecord = isRecord(draftRecord.model) ? draftRecord.model : {};
  const goalRecord = isRecord(draftRecord.goal) ? draftRecord.goal : {};
  const dataRecord = isRecord(draftRecord.data) ? draftRecord.data : {};
  const parametersRecord = isRecord(draftRecord.parameters) ? draftRecord.parameters : {};
  const parameterValues = isRecord(parametersRecord.values)
    ? normalizeParameterValues(parametersRecord.values)
    : {};
  const draftStatus = readString(draftRecord, ["status"], "ready");
  const workflow = Array.isArray(modelRecord.workflow)
    ? modelRecord.workflow as WorkflowState[]
    : Array.isArray(draftRecord.workflow)
      ? draftRecord.workflow as WorkflowState[]
      : previousPlan.model.workflow;
  const draftSlots = readArray(dataRecord, "slots");
  const workflowSlots = workflow.length > 0 ? buildSlotsFromWorkflow(workflow, previousPlan.data.slots) : previousPlan.data.slots;
  const slots = mergeDraftSlots(workflowSlots, draftSlots);

  return touchPlan({
    ...previousPlan,
    title: readString(draftRecord, ["title"], previousPlan.title),
    status: isPlanStatus(draftStatus) ? draftStatus : "ready",
    goal: {
      ...previousPlan.goal,
      objective: readString(goalRecord, ["objective"], previousPlan.goal.objective),
      studyArea: readString(goalRecord, ["studyArea", "study_area"], previousPlan.goal.studyArea),
      timeHorizon: readString(goalRecord, ["timeHorizon", "time_horizon"], previousPlan.goal.timeHorizon),
      assumptions: normalizeStringList(goalRecord.assumptions, previousPlan.goal.assumptions),
      successCriteria: normalizeStringList(goalRecord.successCriteria || goalRecord.success_criteria, previousPlan.goal.successCriteria),
    },
    model: {
      ...previousPlan.model,
      recommendedName:
        readString(modelRecord, ["recommendedName", "recommended_name", "name"], "") ||
        readString(draftRecord, ["recommendedModelName"], previousPlan.model.recommendedName || "") ||
        previousPlan.model.recommendedName,
      description: readString(modelRecord, ["description"], previousPlan.model.description),
      alternatives: normalizeAlternatives(modelRecord.alternatives || previousPlan.model.alternatives),
      contract: modelRecord.contract || draftRecord.modelContract || previousPlan.model.contract,
      workflow,
    },
    data: {
      notes: readString(dataRecord, ["notes"], previousPlan.data.notes),
      slots,
    },
    parameters: {
      notes: readString(parametersRecord, ["notes"], previousPlan.parameters.notes),
      values: {
        ...getPlanParameterValuesFromSlots(slots, previousPlan.parameters.values),
        ...parameterValues,
      },
    },
    result: previousPlan.result,
    agentNotes: readString(draftRecord, ["agentNotes", "agent_notes"], previousPlan.agentNotes),
  });
};

export const serializeSimulationPlan = (plan: SimulationPlan): SimulationPlan => {
  return JSON.parse(JSON.stringify(plan));
};

export const collectResultOutputs = (result: unknown): SimulationPlanResultOutput[] => {
  const resultRecord = isRecord(result) ? result : {};
  const rawOutputs = Array.isArray(resultRecord.result)
    ? resultRecord.result
    : Array.isArray(resultRecord.outputs)
      ? resultRecord.outputs
      : [];

  return rawOutputs
    .filter((item): item is UnknownRecord => isRecord(item) && typeof item.url === "string" && item.url.length > 0)
    .map((item, index: number) => ({
      name: readString(item, ["name", "outputName"], `Output-${index + 1}`),
      url: item.url as string,
      type: readString(item, ["type", "mimeType"], undefined),
    }));
};

export const isPlanRunnable = (
  plan: SimulationPlan,
  runtimeFiles: Record<string, File>,
) => {
  if (!plan.model.recommendedName || plan.model.workflow.length === 0) return false;
  if (plan.data.slots.length === 0) return false;

  return plan.data.slots.every((slot) => {
    if (!slot.required) return true;
    if (slot.kind === "file") return Boolean(runtimeFiles[slot.id] || runtimeFiles[slot.name]);
    return slot.value !== null && slot.value !== "";
  });
};

const normalizeAlternatives = (value: unknown): SimulationPlanAlternativeModel[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { name: item };
      if (!isRecord(item)) return { name: "" };
      return {
        name: readString(item, ["name", "modelName"]),
        description: readString(item, ["description", "desc"]),
        reason: readString(item, ["reason"]),
      };
    })
    .filter((item) => item.name);
};

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((item) => item.trim()).filter(Boolean);
  return fallback;
};

const mergeDraftSlots = (
  workflowSlots: SimulationPlanInputSlot[],
  draftSlots: unknown[],
) => {
  if (draftSlots.length === 0) return workflowSlots;
  const byName = new Map(workflowSlots.map((slot) => [slot.name, slot]));
  return draftSlots.map((slotValue, index: number) => {
    const slot = isRecord(slotValue) ? slotValue : {};
    const name = readString(slot, ["name", "Input_name", "slot_name"], `slot_${index + 1}`);
    const previous = byName.get(name);
    const type = readString(slot, ["type"], previous?.type || "TEXT");
    const kind = readString(slot, ["kind"], "");
    const required = typeof slot.required === "boolean" ? slot.required : previous?.required ?? true;
    const value = typeof slot.value === "string" || typeof slot.value === "number" ? slot.value : previous?.value ?? null;
    return {
      id: previous?.id || readString(slot, ["id"], `draft@@@${name}`),
      name,
      type,
      kind: kind === "file" || kind === "text" || kind === "number" || kind === "parameter" ? kind : getInputKind(type),
      description: readString(slot, ["description", "Semantic_requirement"], previous?.description || ""),
      required,
      value,
      fileName: readString(slot, ["fileName"], previous?.fileName),
      source: readString(slot, ["source"], previous?.source || "Plan draft"),
    } satisfies SimulationPlanInputSlot;
  });
};

const touchPlan = (plan: SimulationPlan): SimulationPlan => ({
  ...plan,
  updatedAt: nowIso(),
});
