"use server";

import { analyzeDeviation, type AnalyzeDeviationInput } from "@/ai/flows/deviation-analysis-assistant";
import { costs, projects } from "@/lib/data";

export async function runDeviationAnalysis(projectId: string) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const projectCosts = costs.filter((c) => c.projectId === projectId);
  
  const predictedCost = projectCosts.reduce((acc, cost) => acc + cost.predictedAmount, 0);
  const actualCost = projectCosts.reduce((acc, cost) => acc + cost.actualAmount, 0);

  if (predictedCost === 0) {
    return null; // Cannot analyze deviation if predicted cost is zero
  }

  const input: AnalyzeDeviationInput = {
    projectName: project.name,
    predictedCost,
    actualCost,
    deviationThresholdPercentage: 10,
    projectDescription: `Análise de custos para o projeto ${project.name}, com início em ${project.startDate} e fim previsto para ${project.endDate}.`,
    costCategories: projectCosts.map(cost => ({
      category: cost.category,
      predicted: cost.predictedAmount,
      actual: cost.actualAmount,
    })),
  };

  try {
    const result = await analyzeDeviation(input);
    return result;
  } catch (error) {
    console.error("Error running deviation analysis:", error);
    return null;
  }
}
