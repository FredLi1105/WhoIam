import IntroLogo from "../component/IntroLogo";
import Background from "../component/Background";
import SkillRadar from "../component/SkillRadar";
import ProjectExpansion from "../component/ProjectExpansion";
import { educationData, projectData } from "../data/constant";
import ConstellationReveal from "../component/ConstellationReveal";

export function MainLayout() {
  return (
    <div className="main-layout">
      <Background />
      <header className="main-header  margin-top-20">
        <IntroLogo initials="FL" name="Fred Li" />
      </header>
      <main
        className="main-content margin-top-20"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "space-between",
          width: "100vw",
          justifyContent: "space-between",
          padding: "80px 40px",
        }}
      >
        <SkillRadar
          skills={[
            { label: "Frontend", value: 100 },
            { label: "Backend", value: 100 },
            { label: "Deployment", value: 100 },
            { label: "Design", value: 100 },
            { label: "Creativity", value: 130 },
            { label: "Testing", value: 100 },
          ]}
          duration={3000}
        />

        <ConstellationReveal duration={3000} />

        <div className="flex-column">
          <ProjectExpansion project={projectData} />
          <ProjectExpansion project={educationData} />
        </div>
      </main>
      <footer className="main-footer"></footer>
    </div>
  );
}
