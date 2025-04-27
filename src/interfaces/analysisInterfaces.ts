export interface FileWithOriginalname extends Express.Multer.File {
	originalname: string;
}

export interface AnalysisResult {
	language?: string;
	summary?: string;
	sentiment?: string;
	mood?: string;
	bias_level?: string;
	bias_direction?: string;
	subjectivity?: string;
	indicators?: string[];
	reasoning?: string;
	error?: string;
	details?: string;
}

export interface AnalysisResponse {
	fileType: string;
	extractedText: string;
	analysis: AnalysisResult;
	fileUrl: string;
}
