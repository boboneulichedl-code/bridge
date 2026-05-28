import { PreviewShell } from "@bridge/ui";
import { S01ColorTokens } from "./sections/S01ColorTokens";
import { S02Typography } from "./sections/S02Typography";
import { S03Spacing } from "./sections/S03Spacing";
import { S04RadiusSurface } from "./sections/S04RadiusSurface";
import { S05ButtonStates } from "./sections/S05ButtonStates";
import { S06StatusBasics } from "./sections/S06StatusBasics";
import { S11ModuleStackBasics } from "./sections/S11ModuleStackBasics";
import { S15MobileFrame } from "./sections/S15MobileFrame";

const SECTION_LINKS = ["S01", "S02", "S03", "S04", "S05", "S06", "S11", "S15"];

export function App() {
  return (
    <PreviewShell
      nav={
        <nav className="preview-nav" aria-label="Preview sections">
          {SECTION_LINKS.map((id) => (
            <a key={id} href={`#${id}`}>
              {id}
            </a>
          ))}
        </nav>
      }
    >
      <S01ColorTokens />
      <S02Typography />
      <S03Spacing />
      <S04RadiusSurface />
      <S05ButtonStates />
      <S06StatusBasics />
      <S11ModuleStackBasics />
      <S15MobileFrame />
    </PreviewShell>
  );
}
