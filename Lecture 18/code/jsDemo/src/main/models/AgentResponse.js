export class AgentResponse {
  constructor({ answer, retrievedDocuments, toolsUsed, toolArguments, toolResults, context }) {
    Object.assign(this, { answer, retrievedDocuments, toolsUsed, toolArguments, toolResults, context });
  }
}
