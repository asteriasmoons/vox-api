export interface JournalAnalysisResult {
    themes: string[];
    mood: string;
    reflection: string;
}
interface EntryInput {
    title: string;
    body: string;
}
export declare function generateJournalAnalysis(entries: EntryInput[]): Promise<JournalAnalysisResult>;
export {};
//# sourceMappingURL=generateJournalAnalysis.d.ts.map