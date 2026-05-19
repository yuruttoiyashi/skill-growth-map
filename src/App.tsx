import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

const STORAGE_KEYS = {
  skills: "skill-growth-map:skills",
  projects: "skill-growth-map:projects",
  growthLogs: "skill-growth-map:growth-logs",
};

const levelOptions = [
  {
    value: "learning",
    label: "学習中",
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    value: "built",
    label: "実装経験あり",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    value: "portfolio",
    label: "ポートフォリオ掲載済み",
    badge: "bg-purple-50 text-purple-700 ring-purple-100",
  },
  {
    value: "practical",
    label: "実務・業務改善で活用",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    value: "strength",
    label: "強み",
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
  },
] as const;

type SkillLevel = (typeof levelOptions)[number]["value"];

type Skill = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  note: string;
};

type Project = {
  id: string;
  title: string;
  summary: string;
  skills: string[];
  liveUrl?: string;
  githubUrl?: string;
};

type GrowthLog = {
  id: string;
  date: string;
  title: string;
  body: string;
  relatedSkills: string[];
};

type RadarDataItem = {
  label: string;
  score: number;
  count: number;
};

const baseCategories = [
  "Frontend",
  "Backend / BaaS",
  "Database",
  "AI",
  "Business",
  "Design / UI",
  "Office / Qualification",
];

const levelScoreMap: Record<SkillLevel, number> = {
  learning: 25,
  built: 50,
  portfolio: 70,
  practical: 85,
  strength: 95,
};

const initialSkills: Skill[] = [
  {
    id: "skill-react",
    name: "React",
    category: "Frontend",
    level: "built",
    note: "業務アプリの画面構築、状態管理、コンポーネント分割で使用。",
  },
  {
    id: "skill-typescript",
    name: "TypeScript",
    category: "Frontend",
    level: "built",
    note: "型安全な画面設計、フォーム管理、データ型定義に活用。",
  },
  {
    id: "skill-tailwind",
    name: "Tailwind CSS",
    category: "Design / UI",
    level: "built",
    note: "企業向けダッシュボードUI、カードUI、レスポンシブ対応で使用。",
  },
  {
    id: "skill-firebase",
    name: "Firebase",
    category: "Backend / BaaS",
    level: "portfolio",
    note: "Authentication / Firestore / Hosting / Functions を複数アプリで使用。",
  },
  {
    id: "skill-gemini",
    name: "Gemini API",
    category: "AI",
    level: "built",
    note: "AI要約、診断、改善提案、業務支援コメント生成に活用。",
  },
  {
    id: "skill-business-app",
    name: "業務改善アプリ設計",
    category: "Business",
    level: "strength",
    note: "現場課題を整理し、管理画面・ダッシュボードとして可視化する設計が強み。",
  },
];

const initialProjects: Project[] = [
  {
    id: "project-logiroute",
    title: "LogiRoute AI",
    summary: "物流向け配送管理・遅延リスク分析アプリ。",
    skills: ["React", "TypeScript", "Firebase", "Gemini API", "業務改善アプリ設計"],
    liveUrl: "https://logi-route-ai.vercel.app",
    githubUrl: "https://github.com/yuruttoiyashi/Logi-Route-Ai",
  },
  {
    id: "project-keiri",
    title: "Keiri Assist AI",
    summary: "経理向けに勘定科目・借方貸方・税区分を提案するAI支援アプリ。",
    skills: ["React", "TypeScript", "Firebase", "Gemini API"],
    liveUrl: "https://keiri-assist-ai.vercel.app",
    githubUrl: "https://github.com/yuruttoiyashi/keiri-assist-ai",
  },
  {
    id: "project-it-asset",
    title: "IT Asset Vision",
    summary: "社内IT資産の管理・状態確認を想定した業務管理アプリ。",
    skills: ["React", "TypeScript", "Firebase", "業務改善アプリ設計"],
    liveUrl: "https://it-asset-vision.vercel.app",
    githubUrl: "https://github.com/yuruttoiyashi/it-asset-vision",
  },
];

const initialGrowthLogs: GrowthLog[] = [
  {
    id: "growth-20260519-setup",
    date: "2026-05-19",
    title: "Skill Growth Map の開発開始",
    body: "転職活動向けに、学習スキル・制作物・成長ログを一元管理するアプリを作成開始。",
    relatedSkills: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "growth-20260519-storage",
    date: "2026-05-19",
    title: "localStorage保存機能を追加",
    body: "スキルと制作物をブラウザに自動保存し、ページ更新後もデータが残るように実装。",
    relatedSkills: ["React", "TypeScript"],
  },
  {
    id: "growth-20260519-radar",
    date: "2026-05-19",
    title: "レーダーチャート風のスキル可視化を追加",
    body: "登録スキルの到達度をカテゴリ別にスコア化し、現在の強みや学習バランスを可視化できるようにした。",
    relatedSkills: ["React", "TypeScript", "Tailwind CSS"],
  },
];

function createId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;

    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("localStorageへの保存に失敗しました。");
  }
}

function getLevelMeta(level: SkillLevel) {
  return levelOptions.find((option) => option.value === level) ?? levelOptions[0];
}

function getSkillScore(level: SkillLevel) {
  return levelScoreMap[level] ?? 0;
}

function shortenLabel(label: string) {
  return label.length > 16 ? `${label.slice(0, 15)}…` : label;
}

function escapeMarkdownTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br />");
}

function App() {
  const [skills, setSkills] = useState<Skill[]>(() =>
    readStorage(STORAGE_KEYS.skills, initialSkills),
  );

  const [projects, setProjects] = useState<Project[]>(() =>
    readStorage(STORAGE_KEYS.projects, initialProjects),
  );

  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>(() =>
    readStorage(STORAGE_KEYS.growthLogs, initialGrowthLogs),
  );

  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "Frontend",
    level: "learning" as SkillLevel,
    note: "",
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    summary: "",
    liveUrl: "",
    githubUrl: "",
    extraSkills: "",
  });

  const [growthForm, setGrowthForm] = useState({
    date: getTodayString(),
    title: "",
    body: "",
  });

  const [selectedProjectSkillNames, setSelectedProjectSkillNames] = useState<string[]>([]);
  const [selectedGrowthSkillNames, setSelectedGrowthSkillNames] = useState<string[]>([]);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    writeStorage(STORAGE_KEYS.skills, skills);
  }, [skills]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.projects, projects);
  }, [projects]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.growthLogs, growthLogs);
  }, [growthLogs]);

  const categories = useMemo(() => {
    return Array.from(new Set([...baseCategories, ...skills.map((skill) => skill.category)]));
  }, [skills]);

  const categoryGroups = useMemo(() => {
    const groups: Record<string, Skill[]> = {};

    skills.forEach((skill) => {
      groups[skill.category] = groups[skill.category] ?? [];
      groups[skill.category].push(skill);
    });

    return Object.entries(groups);
  }, [skills]);

  const sortedGrowthLogs = useMemo(() => {
    return [...growthLogs].sort((a, b) => b.date.localeCompare(a.date));
  }, [growthLogs]);

  const stats = useMemo(() => {
    const aiSkillCount = skills.filter(
      (skill) =>
        skill.category === "AI" ||
        skill.name.toLowerCase().includes("ai") ||
        skill.name.toLowerCase().includes("gemini"),
    ).length;

    const strengthCount = skills.filter((skill) => skill.level === "strength").length;

    const portfolioSkillCount = skills.filter(
      (skill) => skill.level === "portfolio" || skill.level === "practical",
    ).length;

    return {
      totalSkills: skills.length,
      totalProjects: projects.length,
      totalGrowthLogs: growthLogs.length,
      aiSkillCount,
      strengthCount,
      portfolioSkillCount,
    };
  }, [skills, projects, growthLogs]);

  const radarData = useMemo<RadarDataItem[]>(() => {
    const grouped = new Map<string, { total: number; count: number }>();

    skills.forEach((skill) => {
      const current = grouped.get(skill.category) ?? { total: 0, count: 0 };

      grouped.set(skill.category, {
        total: current.total + getSkillScore(skill.level),
        count: current.count + 1,
      });
    });

    const categoryOrder = new Map(baseCategories.map((category, index) => [category, index]));

    return Array.from(grouped.entries())
      .map(([label, value]) => ({
        label,
        score: Math.round(value.total / value.count),
        count: value.count,
      }))
      .sort((a, b) => {
        const orderA = categoryOrder.get(a.label) ?? 999;
        const orderB = categoryOrder.get(b.label) ?? 999;

        if (orderA !== orderB) return orderA - orderB;
        return b.score - a.score;
      });
  }, [skills]);

  const portfolioMarkdown = useMemo(() => {
    const skillRows = skills
      .map((skill) => {
        const levelLabel = getLevelMeta(skill.level).label;

        return `| ${escapeMarkdownTable(skill.name)} | ${escapeMarkdownTable(
          skill.category,
        )} | ${escapeMarkdownTable(levelLabel)} | ${escapeMarkdownTable(skill.note)} |`;
      })
      .join("\n");

    const radarRows = radarData
      .map((item) => {
        return `| ${escapeMarkdownTable(item.label)} | ${item.score} | ${item.count} |`;
      })
      .join("\n");

    const projectSections = projects
      .map((project) => {
        const links = [
          project.liveUrl ? `- Live Demo: ${project.liveUrl}` : "",
          project.githubUrl ? `- GitHub: ${project.githubUrl}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        return `### ${project.title}

${project.summary}

**使用・証明スキル**
${project.skills.map((skill) => `- ${skill}`).join("\n") || "- 未登録"}

${links || "- URL未登録"}`;
      })
      .join("\n\n");

    const growthSections = sortedGrowthLogs
      .map((log) => {
        return `### ${log.date}｜${log.title}

${log.body}

**関連スキル**
${log.relatedSkills.map((skill) => `- ${skill}`).join("\n") || "- 未登録"}`;
      })
      .join("\n\n");

    return `# Skill Growth Map

## 概要

Skill Growth Map は、学習中の技術・制作物・成長ログを一元管理し、自身のスキル形成過程を可視化するキャリア支援アプリです。

単なる学習記録ではなく、「どの制作物がどのスキルを証明しているか」を整理できる点を重視しています。

## ダッシュボード

- 登録スキル数：${stats.totalSkills}
- 制作物数：${stats.totalProjects}
- 成長ログ数：${stats.totalGrowthLogs}
- AI系スキル数：${stats.aiSkillCount}
- 強みとして登録したスキル数：${stats.strengthCount}
- ポートフォリオ・実務利用レベルのスキル数：${stats.portfolioSkillCount}

## カテゴリ別スキルスコア

| カテゴリ | スコア | 登録スキル数 |
|---|---:|---:|
${radarRows || "| 未登録 | 0 | 0 |"}

## スキル一覧

| スキル | カテゴリ | 到達度 | メモ |
|---|---|---|---|
${skillRows || "| 未登録 | - | - | - |"}

## 制作物と証明スキル

${projectSections || "制作物はまだ登録されていません。"}

## 成長ログ

${growthSections || "成長ログはまだ登録されていません。"}

## ポートフォリオ掲載文

Skill Growth Map は、学習中の技術・制作物・成長ログを一元管理し、自身のスキル形成過程を可視化するキャリア支援アプリです。

React / TypeScript / Tailwind CSS を用いて、スキルカテゴリ別の整理、制作物との紐づけ、成長ログの記録、カテゴリ別スキルスコアの可視化、ポートフォリオ向けMarkdown出力を実装しました。

「どの制作物がどのスキルを証明しているか」を整理できるため、転職活動や面接前の自己分析にも活用できます。
`;
  }, [skills, projects, sortedGrowthLogs, stats, radarData]);

  function handleAddSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = skillForm.name.trim();
    const category = skillForm.category.trim() || "Other";
    const note = skillForm.note.trim() || "これから詳細を記録します。";

    if (!name) {
      alert("スキル名を入力してください。");
      return;
    }

    const duplicated = skills.some(
      (skill) => skill.name.toLowerCase() === name.toLowerCase(),
    );

    if (duplicated) {
      alert("同じ名前のスキルがすでに登録されています。");
      return;
    }

    const newSkill: Skill = {
      id: createId("skill"),
      name,
      category,
      level: skillForm.level,
      note,
    };

    setSkills((current) => [newSkill, ...current]);

    setSkillForm((current) => ({
      ...current,
      name: "",
      note: "",
    }));
  }

  function handleToggleProjectSkillName(name: string) {
    setSelectedProjectSkillNames((current) =>
      current.includes(name)
        ? current.filter((skillName) => skillName !== name)
        : [...current, name],
    );
  }

  function handleToggleGrowthSkillName(name: string) {
    setSelectedGrowthSkillNames((current) =>
      current.includes(name)
        ? current.filter((skillName) => skillName !== name)
        : [...current, name],
    );
  }

  function handleAddProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = projectForm.title.trim();
    const summary = projectForm.summary.trim();

    const extraSkills = projectForm.extraSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const linkedSkills = Array.from(new Set([...selectedProjectSkillNames, ...extraSkills]));

    if (!title) {
      alert("制作物名を入力してください。");
      return;
    }

    if (!summary) {
      alert("制作物の説明を入力してください。");
      return;
    }

    if (linkedSkills.length === 0) {
      alert("関連スキルを1つ以上選択または入力してください。");
      return;
    }

    const newProject: Project = {
      id: createId("project"),
      title,
      summary,
      skills: linkedSkills,
      liveUrl: projectForm.liveUrl.trim() || undefined,
      githubUrl: projectForm.githubUrl.trim() || undefined,
    };

    setProjects((current) => [newProject, ...current]);

    setProjectForm({
      title: "",
      summary: "",
      liveUrl: "",
      githubUrl: "",
      extraSkills: "",
    });

    setSelectedProjectSkillNames([]);
  }

  function handleAddGrowthLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const date = growthForm.date.trim() || getTodayString();
    const title = growthForm.title.trim();
    const body = growthForm.body.trim();

    if (!title) {
      alert("成長ログのタイトルを入力してください。");
      return;
    }

    if (!body) {
      alert("成長ログの内容を入力してください。");
      return;
    }

    const newGrowthLog: GrowthLog = {
      id: createId("growth"),
      date,
      title,
      body,
      relatedSkills: selectedGrowthSkillNames,
    };

    setGrowthLogs((current) => [newGrowthLog, ...current]);

    setGrowthForm({
      date: getTodayString(),
      title: "",
      body: "",
    });

    setSelectedGrowthSkillNames([]);
  }

  function handleDeleteSkill(skill: Skill) {
    const ok = window.confirm(
      `「${skill.name}」を削除しますか？\n制作物・成長ログとの紐づけからも削除されます。`,
    );

    if (!ok) return;

    setSkills((current) => current.filter((item) => item.id !== skill.id));

    setProjects((current) =>
      current.map((project) => ({
        ...project,
        skills: project.skills.filter((skillName) => skillName !== skill.name),
      })),
    );

    setGrowthLogs((current) =>
      current.map((log) => ({
        ...log,
        relatedSkills: log.relatedSkills.filter((skillName) => skillName !== skill.name),
      })),
    );

    setSelectedProjectSkillNames((current) =>
      current.filter((skillName) => skillName !== skill.name),
    );

    setSelectedGrowthSkillNames((current) =>
      current.filter((skillName) => skillName !== skill.name),
    );
  }

  function handleDeleteProject(project: Project) {
    const ok = window.confirm(`「${project.title}」を削除しますか？`);
    if (!ok) return;

    setProjects((current) => current.filter((item) => item.id !== project.id));
  }

  function handleDeleteGrowthLog(log: GrowthLog) {
    const ok = window.confirm(`「${log.title}」を削除しますか？`);
    if (!ok) return;

    setGrowthLogs((current) => current.filter((item) => item.id !== log.id));
  }

  function handleResetSamples() {
    const ok = window.confirm("サンプルデータに戻しますか？現在の入力内容は上書きされます。");
    if (!ok) return;

    setSkills(initialSkills);
    setProjects(initialProjects);
    setGrowthLogs(initialGrowthLogs);
    setSelectedProjectSkillNames([]);
    setSelectedGrowthSkillNames([]);
  }

  function handleClearAll() {
    const ok = window.confirm("すべてのデータを削除しますか？");
    if (!ok) return;

    setSkills([]);
    setProjects([]);
    setGrowthLogs([]);
    setSelectedProjectSkillNames([]);
    setSelectedGrowthSkillNames([]);
  }

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(portfolioMarkdown);
      setCopyMessage("Markdownをコピーしました。");
      window.setTimeout(() => setCopyMessage(""), 2500);
    } catch {
      setCopyMessage("コピーに失敗しました。テキストエリアから手動でコピーしてください。");
    }
  }

  function handleDownloadMarkdown() {
    const blob = new Blob([portfolioMarkdown], {
      type: "text/markdown;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "skill-growth-map-portfolio.md";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-7 text-white shadow-xl md:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                Career Growth Dashboard
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Skill Growth Map
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/90">
                学習中の技術、制作物、資格、成長ログを一元管理し、
                「どの制作物がどのスキルを証明しているか」を見える化するキャリア支援アプリです。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResetSamples}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                サンプルに戻す
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-50"
              >
                全削除
              </button>
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <DashboardCard label="登録スキル" value={stats.totalSkills} note="カテゴリ別に整理" />
          <DashboardCard label="制作物" value={stats.totalProjects} note="スキルと紐づけ" />
          <DashboardCard label="成長ログ" value={stats.totalGrowthLogs} note="学習記録" />
          <DashboardCard label="AI系スキル" value={stats.aiSkillCount} note="Gemini APIなど" />
          <DashboardCard label="強み" value={stats.strengthCount} note="面接で話す軸" />
          <DashboardCard
            label="実績化スキル"
            value={stats.portfolioSkillCount}
            note="掲載・実務利用"
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-500">
                Skill Radar
              </p>
              <h2 className="mt-2 text-2xl font-bold">スキル成熟度レーダー</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                登録スキルの到達度をカテゴリ別にスコア化し、現在の強みの偏りを可視化します。
              </p>
            </div>

            <SkillRadarChart data={radarData} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-purple-500">
                Category Score
              </p>
              <h2 className="mt-2 text-2xl font-bold">カテゴリ別スコア</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                学習中・実装経験・ポートフォリオ掲載・実務活用・強みの段階をもとに算出しています。
              </p>
            </div>

            <CategoryScoreList data={radarData} />

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-700">スコア基準</h3>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <p>学習中：25</p>
                <p>実装経験あり：50</p>
                <p>ポートフォリオ掲載済み：70</p>
                <p>実務・業務改善で活用：85</p>
                <p>強み：95</p>
              </div>
            </div>
          </section>
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-3">
          <form
            onSubmit={handleAddSkill}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-bold">スキル追加</h2>
              <p className="mt-1 text-sm text-slate-500">
                学習中・実装済み・強みなどを登録します。
              </p>
            </div>

            <div className="space-y-4">
              <Field label="スキル名">
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="例：React / Firebase / CSV管理"
                  className="input"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <Field label="カテゴリ">
                  <input
                    list="category-options"
                    value={skillForm.category}
                    onChange={(event) =>
                      setSkillForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="input"
                  />
                  <datalist id="category-options">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </Field>

                <Field label="到達度">
                  <select
                    value={skillForm.level}
                    onChange={(event) =>
                      setSkillForm((current) => ({
                        ...current,
                        level: event.target.value as SkillLevel,
                      }))
                    }
                    className="input"
                  >
                    {levelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="メモ">
                <textarea
                  value={skillForm.note}
                  onChange={(event) =>
                    setSkillForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="どんな場面で使ったか、何を学んだかを記録"
                  rows={4}
                  className="textarea"
                />
              </Field>

              <button type="submit" className="primary-button bg-indigo-600 hover:bg-indigo-700">
                スキルを追加
              </button>
            </div>
          </form>

          <form
            onSubmit={handleAddProject}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-bold">制作物追加</h2>
              <p className="mt-1 text-sm text-slate-500">
                制作物と証明スキルを紐づけます。
              </p>
            </div>

            <div className="space-y-4">
              <Field label="制作物名">
                <input
                  value={projectForm.title}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="例：Skill Growth Map"
                  className="input"
                />
              </Field>

              <Field label="概要">
                <textarea
                  value={projectForm.summary}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  placeholder="制作物の目的・特徴・想定ユーザーなど"
                  rows={3}
                  className="textarea"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <Field label="Live URL">
                  <input
                    value={projectForm.liveUrl}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        liveUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="input"
                  />
                </Field>

                <Field label="GitHub URL">
                  <input
                    value={projectForm.githubUrl}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        githubUrl: event.target.value,
                      }))
                    }
                    placeholder="https://github.com/..."
                    className="input"
                  />
                </Field>
              </div>

              <SkillSelector
                skills={skills}
                selectedSkillNames={selectedProjectSkillNames}
                onToggle={handleToggleProjectSkillName}
                emptyText="先にスキルを登録してください。"
              />

              <Field label="追加スキル・技術">
                <input
                  value={projectForm.extraSkills}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      extraSkills: event.target.value,
                    }))
                  }
                  placeholder="例：Google Maps API, CSV出力"
                  className="input"
                />
                <p className="mt-2 text-xs text-slate-500">
                  カンマ区切りで複数入力できます。
                </p>
              </Field>

              <button type="submit" className="primary-button bg-purple-600 hover:bg-purple-700">
                制作物を追加
              </button>
            </div>
          </form>

          <form
            onSubmit={handleAddGrowthLog}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-bold">成長ログ追加</h2>
              <p className="mt-1 text-sm text-slate-500">
                学習・開発・気づきを日付つきで残します。
              </p>
            </div>

            <div className="space-y-4">
              <Field label="日付">
                <input
                  type="date"
                  value={growthForm.date}
                  onChange={(event) =>
                    setGrowthForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className="input"
                />
              </Field>

              <Field label="タイトル">
                <input
                  value={growthForm.title}
                  onChange={(event) =>
                    setGrowthForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="例：Markdown出力機能を追加"
                  className="input"
                />
              </Field>

              <Field label="内容">
                <textarea
                  value={growthForm.body}
                  onChange={(event) =>
                    setGrowthForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                  placeholder="何を実装したか、何を学んだか、次に改善したいことなど"
                  rows={4}
                  className="textarea"
                />
              </Field>

              <SkillSelector
                skills={skills}
                selectedSkillNames={selectedGrowthSkillNames}
                onToggle={handleToggleGrowthSkillName}
                emptyText="関連スキルを選択できます。"
              />

              <button type="submit" className="primary-button bg-rose-600 hover:bg-rose-700">
                成長ログを追加
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">スキルマップ</h2>
              <p className="mt-1 text-sm text-slate-500">
                カテゴリ別に現在の成長状態を確認できます。
              </p>
            </div>

            {skills.length === 0 ? (
              <EmptyState text="スキルがまだ登録されていません。" />
            ) : (
              <div className="space-y-6">
                {categoryGroups.map(([category, categorySkills]) => (
                  <div key={category}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                        {category}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {categorySkills.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {categorySkills.map((skill) => {
                        const levelMeta = getLevelMeta(skill.level);

                        return (
                          <article
                            key={skill.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-bold">{skill.name}</h4>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {skill.note}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(skill)}
                                className="mini-delete-button"
                              >
                                削除
                              </button>
                            </div>

                            <div className="mt-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${levelMeta.badge}`}
                              >
                                {levelMeta.label}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold">制作物とスキルの紐づけ</h2>
                <p className="mt-1 text-sm text-slate-500">
                  面接で「この作品でこのスキルを使いました」と説明しやすくします。
                </p>
              </div>

              {projects.length === 0 ? (
                <EmptyState text="制作物がまだ登録されていません。" />
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{project.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {project.summary}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          className="mini-delete-button"
                        >
                          削除
                        </button>
                      </div>

                      <TagList items={project.skills} emptyText="スキル未紐づけ" />

                      {(project.liveUrl || project.githubUrl) && (
                        <div className="mt-5 flex flex-wrap gap-3">
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
                            >
                              Live Demo
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold">成長ログ</h2>
                <p className="mt-1 text-sm text-slate-500">
                  学習・開発の積み上げを時系列で確認できます。
                </p>
              </div>

              {sortedGrowthLogs.length === 0 ? (
                <EmptyState text="成長ログがまだ登録されていません。" />
              ) : (
                <div className="space-y-4">
                  {sortedGrowthLogs.map((log) => (
                    <article key={log.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-bold text-indigo-600">{log.date}</p>
                          <h3 className="mt-2 text-lg font-bold">{log.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{log.body}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGrowthLog(log)}
                          className="mini-delete-button"
                        >
                          削除
                        </button>
                      </div>

                      <TagList items={log.relatedSkills} emptyText="関連スキル未登録" />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">ポートフォリオ用Markdown出力</h2>
              <p className="mt-1 text-sm text-slate-500">
                登録したスキル・制作物・成長ログ・カテゴリ別スコアから、提出用の文章を自動生成します。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Markdownをコピー
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                .mdで保存
              </button>
            </div>
          </div>

          {copyMessage && (
            <p className="mb-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
              {copyMessage}
            </p>
          )}

          <textarea
            value={portfolioMarkdown}
            readOnly
            rows={18}
            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-sm leading-7 text-slate-100 outline-none"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="text-xl font-bold text-indigo-950">保存について</h2>
          <p className="mt-2 text-sm leading-7 text-indigo-900">
            登録したスキル・制作物・成長ログは、このブラウザのlocalStorageに自動保存されます。
            ページを更新してもデータは残ります。別端末共有やログイン管理は、次の段階で
            Firebase Authentication + Firestore に拡張できます。
          </p>
        </section>
      </section>
    </main>
  );
}

function DashboardCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </article>
  );
}

function SkillRadarChart({ data }: { data: RadarDataItem[] }) {
  const chartData = data.slice(0, 8);

  if (chartData.length < 3) {
    return (
      <EmptyState text="レーダーチャートは、スキルカテゴリが3件以上になると表示されます。" />
    );
  }

  const size = 360;
  const center = size / 2;
  const radius = 125;
  const maxScore = 100;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  function getPoint(index: number, score: number) {
    const angle = (Math.PI * 2 * index) / chartData.length - Math.PI / 2;
    const distance = (score / maxScore) * radius;

    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  }

  function getGridPolygon(level: number) {
    return chartData
      .map((_, index) => {
        const point = getPoint(index, level * maxScore);
        return `${point.x},${point.y}`;
      })
      .join(" ");
  }

  const polygonPoints = chartData
    .map((item, index) => {
      const point = getPoint(index, item.score);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[360px] w-full max-w-[420px]"
        role="img"
        aria-label="スキルカテゴリ別の成熟度レーダーチャート"
      >
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={getGridPolygon(level)}
            className="fill-none stroke-slate-200"
            strokeWidth="1"
          />
        ))}

        {chartData.map((item, index) => {
          const outerPoint = getPoint(index, maxScore);

          return (
            <line
              key={item.label}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              className="stroke-slate-200"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          className="fill-indigo-500/20 stroke-indigo-600"
          strokeWidth="3"
        />

        {chartData.map((item, index) => {
          const point = getPoint(index, item.score);

          return (
            <circle
              key={`${item.label}-point`}
              cx={point.x}
              cy={point.y}
              r="5"
              className="fill-indigo-600 stroke-white"
              strokeWidth="2"
            />
          );
        })}

        {chartData.map((item, index) => {
          const labelPoint = getPoint(index, 118);
          const textAnchor =
            labelPoint.x < center - 12
              ? "end"
              : labelPoint.x > center + 12
                ? "start"
                : "middle";

          return (
            <g key={`${item.label}-label`}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-slate-700 text-[10px] font-bold"
              >
                {shortenLabel(item.label)}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 13}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-indigo-500 text-[10px] font-bold"
              >
                {item.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CategoryScoreList({ data }: { data: RadarDataItem[] }) {
  const sortedData = [...data].sort((a, b) => b.score - a.score);

  if (sortedData.length === 0) {
    return <EmptyState text="スキルを登録するとカテゴリ別スコアが表示されます。" />;
  }

  return (
    <div className="space-y-4">
      {sortedData.map((item) => (
        <article key={item.label} className="rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">{item.label}</h3>
              <p className="mt-1 text-xs text-slate-500">
                登録スキル {item.count} 件の平均スコア
              </p>
            </div>
            <p className="text-2xl font-black text-indigo-600">{item.score}</p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${item.score}%` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SkillSelector({
  skills,
  selectedSkillNames,
  onToggle,
  emptyText,
}: {
  skills: Skill[];
  selectedSkillNames: string[];
  onToggle: (name: string) => void;
  emptyText: string;
}) {
  return (
    <Field label="関連スキル">
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {skills.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          skills.map((skill) => {
            const selected = selectedSkillNames.includes(skill.name);

            return (
              <button
                type="button"
                key={skill.id}
                onClick={() => onToggle(skill.name)}
                className={`rounded-full px-3 py-2 text-xs font-bold ring-1 transition ${
                  selected
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50"
                }`}
              >
                {skill.name}
              </button>
            );
          })
        )}
      </div>
    </Field>
  );
}

function TagList({ items, emptyText }: { items: string[]; emptyText: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.length === 0 ? (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {emptyText}
        </span>
      ) : (
        items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
          >
            {item}
          </span>
        ))
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}

export default App;