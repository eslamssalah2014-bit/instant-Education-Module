import { ObservationScore, ObservationCriterion } from '../types.js';

export interface ScoreCalculationResult {
  scoresWithCalculations: {
    criterionId: string;
    criterionName: string;
    score: number;
    weight: number;
    weightedScore: number;
    feedback: string;
  }[];
  totalScore: number;       // Average of 1-10 scores
  weightedScore: number;    // Out of 100
  percentageScore: number;  // 0 - 100%
  grade: string;
}

export function calculateObservationScores(
  criteria: ObservationCriterion[],
  submittedScores: { criterionId: string; score: number; feedback: string }[]
): ScoreCalculationResult {
  const criteriaMap = new Map<string, ObservationCriterion>();
  for (const c of criteria) {
    criteriaMap.set(c.id, c);
  }

  let totalRawScore = 0;
  let totalWeightedScore = 0;
  let count = 0;

  const scoresWithCalculations = submittedScores.map((item) => {
    const criterion = criteriaMap.get(item.criterionId);
    const weight = criterion ? criterion.weightPercentage : 0;
    const criterionName = criterion ? criterion.name : 'Unknown Criterion';
    
    // Weighted score formula: (score / 10) * weight
    // e.g. score 8.5/10 with 25% weight = 0.85 * 25 = 21.25 points
    const weightedScore = Number(((item.score / 10) * weight).toFixed(2));
    
    totalRawScore += item.score;
    totalWeightedScore += weightedScore;
    count += 1;

    return {
      criterionId: item.criterionId,
      criterionName,
      score: item.score,
      weight,
      weightedScore,
      feedback: item.feedback || '',
    };
  });

  const totalScore = count > 0 ? Number((totalRawScore / count).toFixed(2)) : 0;
  const weightedScore = Number(totalWeightedScore.toFixed(2));
  const percentageScore = weightedScore; // Since weights sum to 100%

  let grade = 'Proficient';
  if (percentageScore >= 90) {
    grade = 'Outstanding';
  } else if (percentageScore >= 80) {
    grade = 'Proficient';
  } else if (percentageScore >= 70) {
    grade = 'Developing';
  } else {
    grade = 'Needs Immediate Attention';
  }

  return {
    scoresWithCalculations,
    totalScore,
    weightedScore,
    percentageScore,
    grade,
  };
}
