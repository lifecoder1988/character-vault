import type { AvatarConfig } from "@/lib/avatar";
import { parseAvatarConfig } from "@/lib/avatar";

/** 分层 SVG 捏脸小人：发型(后层) → 身体 → 脖子 → 头 → 五官/胡子 → 发型(前层) */
export function AvatarSvg({
  config,
  clothColor,
  size = 64,
}: {
  config: AvatarConfig;
  clothColor: string;
  size?: number;
}) {
  const { face, skin, hair, hairColor, beard, body } = config;
  const line = "#3a2e2e";

  const bodyPath = {
    slim: "M33 100 C33 83 41 75 50 75 C59 75 67 83 67 100 Z",
    average: "M27 100 C27 81 38 73 50 73 C62 73 73 81 73 100 Z",
    strong: "M19 100 C21 77 34 69 50 69 C66 69 79 77 81 100 Z",
    round: "M21 100 C19 80 33 71 50 71 C67 71 81 80 79 100 Z",
  }[body];

  const facePath = {
    round: "M50 21 C62 21 69 30 69 40 C69 51 61 59 50 59 C39 59 31 51 31 40 C31 30 38 21 50 21 Z",
    oval: "M50 20 C62 20 68 30 67 40 C66 51 59 60 50 60 C41 60 34 51 33 40 C32 30 38 20 50 20 Z",
    square:
      "M50 22 C61 22 67 25 67 34 L67 47 C67 55 60 59 50 59 C40 59 33 55 33 47 L33 34 C33 25 39 22 50 22 Z",
    long: "M50 19 C61 19 66 29 66 40 C66 52 59 61 50 61 C41 61 34 52 34 40 C34 29 39 19 50 19 Z",
  }[face];

  const hairBack: Record<string, React.ReactNode> = {
    long: (
      <path
        d="M30 34 C30 20 39 13 50 13 C61 13 70 20 70 34 L70 62 C70 72 62 76 60 70 L60 42 L40 42 L40 70 C38 76 30 72 30 62 Z"
        fill={hairColor}
      />
    ),
    twintail: (
      <g fill={hairColor}>
        <circle cx="27" cy="33" r="7" />
        <circle cx="73" cy="33" r="7" />
        <ellipse cx="25.5" cy="50" rx="4.5" ry="13" />
        <ellipse cx="74.5" cy="50" rx="4.5" ry="13" />
      </g>
    ),
  };

  const hairFront: Record<string, React.ReactNode> = {
    short: (
      <path
        d="M30 39 C30 23 39 16 50 16 C61 16 70 23 70 39 C67 29 60 26 50 26 C40 26 33 29 30 39 Z"
        fill={hairColor}
      />
    ),
    long: (
      <path
        d="M30 40 C30 23 39 16 50 16 C61 16 70 23 70 40 C67 29 60 27 50 27 C40 27 33 29 30 40 Z"
        fill={hairColor}
      />
    ),
    twintail: (
      <path
        d="M30 39 C30 23 39 16 50 16 C61 16 70 23 70 39 C67 29 60 26 50 26 C40 26 33 29 30 39 Z"
        fill={hairColor}
      />
    ),
    bun: (
      <g fill={hairColor}>
        <circle cx="50" cy="14" r="7" />
        <path d="M30 39 C30 23 39 16 50 16 C61 16 70 23 70 39 C67 29 60 26 50 26 C40 26 33 29 30 39 Z" />
      </g>
    ),
    curly: (
      <g fill={hairColor}>
        <circle cx="34" cy="30" r="8" />
        <circle cx="42" cy="23" r="8" />
        <circle cx="50" cy="21" r="8" />
        <circle cx="58" cy="23" r="8" />
        <circle cx="66" cy="30" r="8" />
      </g>
    ),
    spiky: (
      <path
        d="M31 37 L33 19 L40 27 L45 14 L51 25 L57 14 L62 26 L68 19 L69 37 C64 28 57 25 50 25 C43 25 36 28 31 37 Z"
        fill={hairColor}
      />
    ),
    bald: null,
  };

  const beardNode: Record<string, React.ReactNode> = {
    none: null,
    mustache: (
      <path
        d="M41 47.5 Q45.5 44.5 49 46.5 M51 46.5 Q54.5 44.5 59 47.5"
        stroke={hairColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    ),
    goatee: <path d="M45 55.5 L55 55.5 L50 63 Z" fill={hairColor} />,
    full: (
      <path
        d="M33 41 C33 54 40 60 50 60 C60 60 67 54 67 41 C67 50 60 54.5 50 54.5 C40 54.5 33 50 33 41 Z"
        fill={hairColor}
      />
    ),
  };

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {hairBack[hair] ?? null}
      <path d={bodyPath} fill={clothColor} />
      <rect x="44" y="52" width="12" height="20" rx="5" fill={skin} />
      <path d={facePath} fill={skin} />
      <circle cx="43" cy="40" r="1.9" fill={line} />
      <circle cx="57" cy="40" r="1.9" fill={line} />
      <circle cx="38.5" cy="45.5" r="2.2" fill="#ff9d9d" opacity="0.45" />
      <circle cx="61.5" cy="45.5" r="2.2" fill="#ff9d9d" opacity="0.45" />
      <path
        d="M45 49 Q50 53 55 49"
        stroke={line}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {beardNode[beard] ?? null}
      {hairFront[hair] ?? null}
    </svg>
  );
}

/** 人物头像：有捏脸配置时渲染 SVG 小人，否则回退到 emoji（兼容旧数据） */
export function CharacterAvatar({
  config,
  emoji,
  color,
  size = 48,
}: {
  config: string;
  emoji: string;
  color: string;
  size?: number;
}) {
  const parsed = parseAvatarConfig(config);
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        backgroundColor: `${color}22`,
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
    >
      {parsed ? (
        <AvatarSvg config={parsed} clothColor={color} size={size * 0.92} />
      ) : (
        <span>{emoji || "🙂"}</span>
      )}
    </div>
  );
}
