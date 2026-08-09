import type { ProjectData } from "../component/ProjectExpansion";

export const projectData: ProjectData = {
  name: "",
  description: "",
  component: [
    {
      name: "Skill set pull",
      description:
        "Full-stack engineer capable of taking products from 0→1—from architecture and development to deployment and production.",
      technology: [],
    },
    {
      name: "Frontend",
      description: "",
      // "Built an engaging, intuitive frontend that attracts customers and elevates overall user satisfaction.",
      technology: ["React", "TypeScript", "Javascript", "Redux"],
    },
    {
      name: "Backend",
      description: "",
      // "Data cleaning, communication services, authentication, data encryption, file generation",
      technology: [
        "Spring Boot",
        "Kafka",
        "Java",
        "Apollo Graphql",
        "Node.js",
        "websocket",
      ],
    },
    {
      name: "Testing",
      description: "", //"Automated testing, unit testing, integration testing",
      technology: ["Cypress"],
    },
    {
      name: "Infrastructure",
      description: "", //"Containerized and deployed services.",
      technology: ["Docker", "Kubernetes", "Spinnekar", "Terraform"],
    },
  ],
};

export const educationData: ProjectData = {
  name: "Investor Risk Analysis",
  description:
    "Internal platform for automating investor information and risk analysis.",
  component: [
    {
      name: "Education info",
      description: "",
      technology: [
        "3D printing",
        "Decision tree AI",
        "Robotics",
        "Computer vision",
        "AI for robotics",
      ],
    },
    {
      name: "Rochester Institute of Technology",
      description: "Master of Science in Computer Science",
      technology: [],
    },
    {
      name: "State University of New York at Albany",
      description: "Bachelor of Science in Computer Engineering",
      technology: [],
    },
  ],
};
