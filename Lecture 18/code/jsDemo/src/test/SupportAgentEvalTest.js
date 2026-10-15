import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApplication } from '../main/TestingDemoApplication.js';
import { resources } from '../main/SupportService.js';
import { ChatClient } from '../main/infrastructure/ChatClient.js';
import { EvalCase } from '../main/models/EvalCase.js';
import { JudgeResult } from '../main/models/JudgeResult.js';

const metrics = ['relevance', 'correctness', 'faithfulness', 'helpfulness', 'hallucinationFree'];

test('runGoldenDataset', async () => {
  const { supportService } = await createApplication();
  const judgeClient = new ChatClient();
  const cases = JSON.parse(await readFile(new URL('golden-dataset.json', resources), 'utf8'));
  const rubric = await readFile(new URL('judge-rubric.txt', resources), 'utf8');
  const totals = Object.fromEntries(metrics.map(metric => [metric, 0]));
  const failures = [];
  for (const data of cases) {
    const evalCase = new EvalCase(data);
    const response = await supportService.chat(evalCase.question);
    const checks = {
      'Response exists': Boolean(response.answer?.trim()),
      'Correct tool': evalCase.expectedTool === null ? response.toolsUsed.length === 0
        : response.toolsUsed.includes(evalCase.expectedTool),
      'Correct tool argument': evalCase.expectedTool === null ||
        response.toolArguments[evalCase.expectedTool] === evalCase.expectedToolArgument,
      'Expected source retrieved': evalCase.expectedSource === null ||
        response.retrievedDocuments.includes(evalCase.expectedSource),
    };
    const prompt = `Evaluate the AI answer below.\n\nUSER QUESTION:\n${evalCase.question}\n\n` +
      `EXPECTED ANSWER:\n${evalCase.expectedAnswer}\n\nEXPECTED BEHAVIOR:\n${evalCase.expectedBehavior}\n\n` +
      `RETRIEVED POLICY CONTEXT:\n${response.context}\n\nTOOL RESULTS:\n${JSON.stringify(response.toolResults)}\n\n` +
      `ACTUAL ANSWER:\n${response.answer}\n\n${rubric}\n\n` +
      `Return a JSON object with integer fields ${metrics.join(', ')} and a string reason.`;
    const message = await judgeClient.complete([
      { role: 'system', content: 'You are a strict evaluator of AI application responses. Return JSON.' },
      { role: 'user', content: prompt },
    ], [], true);
    const judge = new JudgeResult(JSON.parse(message.content));
    for (const metric of metrics) {
      assert.ok(Number.isInteger(judge[metric]) && judge[metric] >= 1 && judge[metric] <= 5,
        `Invalid judge score: ${metric}`);
      totals[metric] += judge[metric];
    }
    const passed = Object.values(checks).every(Boolean) && metrics.every(metric => judge[metric] >= 4);
    if (!passed) failures.push(evalCase.id);
    console.log(JSON.stringify({ test: evalCase.id, question: evalCase.question, answer: response.answer,
      deterministic: checks, quality: judge, final: passed ? 'PASS' : 'FAIL' }, null, 2));
  }
  console.log('FINAL EVALUATION REPORT', { total: cases.length, passed: cases.length - failures.length,
    failed: failures.length, averages: Object.fromEntries(metrics.map(metric =>
      [metric, Math.round(totals[metric] / cases.length * 100) / 100])) });
  assert.deepEqual(failures, [], `Failed Eval Cases: ${failures.join(', ')}`);
});
