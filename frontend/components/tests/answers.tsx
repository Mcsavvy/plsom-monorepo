import { useEffect, useState } from "react";
import { TestQuestion } from "@/types/tests";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Upload, X } from "lucide-react";


interface QuestionComponentProps {
  question: TestQuestion;
  answer: any;
  onAnswerChange: (answer: any) => void;
  onFileUpload?: (questionId: string, file: File) => Promise<void>;
  onFileDelete?: (questionId: string) => Promise<void>;
}

// Text/Essay Question Component
function TextQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const isEssay = question.question_type === "essay";
  const Component = isEssay ? Textarea : Input;

  return (
    <div className="space-y-3">
      <Component
        placeholder={question.text_placeholder || "Enter your answer..."}
        value={answer?.text_answer || ""}
        onChange={(e) => onAnswerChange({ question_id: question.id, text_answer: e.target.value })}
        maxLength={question.text_max_length || undefined}
        className={isEssay ? "min-h-[120px]" : undefined}
      />

      {question.min_word_count && (
        <div className="text-sm text-muted-foreground">
          Minimum {question.min_word_count} words
          {question.max_word_count && ` • Maximum ${question.max_word_count} words`}
        </div>
      )}

      {question.text_max_length && (
        <div className="text-sm text-muted-foreground text-right">
          {answer?.text_answer?.length || 0} / {question.text_max_length} characters
        </div>
      )}
    </div>
  );
}

// Yes/No Question Component
function YesNoQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const selectedValue = answer?.boolean_answer;

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`question-${question.id}`}
            value="true"
            checked={selectedValue === true}
            onChange={() => onAnswerChange({
              question_id: question.id,
              boolean_answer: true
            })}
            className="text-primary"
          />
          <span>Yes</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`question-${question.id}`}
            value="false"
            checked={selectedValue === false}
            onChange={() => onAnswerChange({
              question_id: question.id,
              boolean_answer: false
            })}
            className="text-primary"
          />
          <span>No</span>
        </label>
      </div>
    </div>
  );
}

// Single Choice Question Component
function SingleChoiceQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const selectedValue = answer?.selected_options?.[0] || "";

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option.id}
            checked={selectedValue === option.id}
            onChange={(e) => onAnswerChange({
              question_id: question.id,
              selected_options: [e.target.value]
            })}
            className="text-primary"
          />
          <span className="flex-1">{option.text}</span>
        </label>
      ))}
    </div>
  );
}

// Multiple Choice Question Component
function MultipleChoiceQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const selectedOptions = answer?.selected_options || [];

  const handleOptionChange = (optionId: string, checked: boolean) => {
    let newSelected = [...selectedOptions];
    if (checked) {
      if (!newSelected.includes(optionId)) {
        newSelected.push(optionId);
      }
    } else {
      newSelected = newSelected.filter(id => id !== optionId);
    }
    onAnswerChange({ question_id: question.id, selected_options: newSelected });
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
          <Checkbox
            checked={selectedOptions.includes(option.id)}
            onCheckedChange={(checked) => handleOptionChange(option.id, !!checked)}
          />
          <span className="flex-1">{option.text}</span>
        </label>
      ))}
    </div>
  );
}

// Scripture Reference Question Component
function ScriptureReferenceQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const [book, setBook] = useState(answer?.scripture_references?.[0]?.book || "");
  const [chapter, setChapter] = useState(answer?.scripture_references?.[0]?.chapter || "");
  const [verseStart, setVerseStart] = useState(answer?.scripture_references?.[0]?.verse_start || "");
  const [verseEnd, setVerseEnd] = useState(answer?.scripture_references?.[0]?.verse_end || "");
  const [translation, setTranslation] = useState(answer?.scripture_references?.[0]?.translation || question.required_translation || "ESV");

  const updateAnswer = () => {
    if (book && chapter && verseStart) {
      const reference = {
        book,
        chapter: parseInt(chapter),
        verse_start: parseInt(verseStart),
        verse_end: verseEnd ? parseInt(verseEnd) : undefined,
        translation,
      };
      onAnswerChange({
        question_id: question.id,
        scripture_references: [reference],
      });
    }
  };

  useEffect(() => {
    updateAnswer();
  }, [book, chapter, verseStart, verseEnd, translation]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label htmlFor="book">Book</Label>
          <Input
            id="book"
            placeholder="e.g., Romans"
            value={book}
            onChange={(e) => setBook(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="chapter">Chapter</Label>
          <Input
            id="chapter"
            type="number"
            placeholder="1"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="verse-start">Verse Start</Label>
          <Input
            id="verse-start"
            type="number"
            placeholder="1"
            value={verseStart}
            onChange={(e) => setVerseStart(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="verse-end">Verse End (Optional)</Label>
          <Input
            id="verse-end"
            type="number"
            placeholder="5"
            value={verseEnd}
            onChange={(e) => setVerseEnd(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="translation">Translation</Label>
        <Select value={translation} onValueChange={setTranslation}>
          <SelectTrigger>
            <SelectValue placeholder="Select translation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ESV">ESV</SelectItem>
            <SelectItem value="NIV">NIV</SelectItem>
            <SelectItem value="NASB">NASB</SelectItem>
            <SelectItem value="KJV">KJV</SelectItem>
            <SelectItem value="NKJV">NKJV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {question.required_translation && (
        <div className="text-sm text-muted-foreground">
          Required translation: {question.required_translation}
        </div>
      )}
    </div>
  );
}

// File Upload Question Component
function FileUploadQuestionComponent({ question, answer, onAnswerChange, onFileUpload, onFileDelete }: QuestionComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  // Initialize existing file URL if available
  useEffect(() => {
    if (answer && 'file_url' in answer && answer.file_url) {
      setExistingFileUrl(answer.file_url);
    }
  }, [answer]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onFileUpload) return;

    // Check file size
    if (question.max_file_size_mb && file.size > question.max_file_size_mb * 1024 * 1024) {
      setUploadError(`File size must be less than ${question.max_file_size_mb}MB`);
      return;
    }

    // Check file type
    if (question.allowed_file_types) {
      const allowedTypes = question.allowed_file_types.split(',').map(t => t.trim().toLowerCase());
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !allowedTypes.includes(fileExtension)) {
        setUploadError(`File type not allowed. Allowed types: ${question.allowed_file_types}`);
        return;
      }
    }

    try {
      setUploading(true);
      setUploadError(null);
      await onFileUpload(question.id, file);
      setSelectedFile(file);
      // Update local state to show file is uploaded
      onAnswerChange({
        question_id: question.id,
        file_answer: file,
      });
    } catch (error) {
      toastError(error, "Failed to upload file");
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async () => {
    try {
      // If there's an existing file URL, delete it from the backend
      if (existingFileUrl && onFileDelete) {
        setUploading(true);
        setUploadError(null);
        await onFileDelete(question.id);
        toastSuccess("File deleted successfully");
      }

      // Clear local state
      setSelectedFile(null);
      setExistingFileUrl(null);
      setUploadError(null);
      onAnswerChange({
        question_id: question.id,
        file_answer: undefined,
        file_url: undefined,
      });
    } catch (error) {
      toastError(error, "Failed to delete file");
      setUploadError("Failed to delete file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {uploadError}
        </div>
      )}

      {!selectedFile && !existingFileUrl ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center relative">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {uploading ? "Uploading..." : "Click to upload a file"}
            </p>
            <p className="text-xs text-muted-foreground">
              {question.allowed_file_types && `Allowed: ${question.allowed_file_types}`}
              {question.max_file_size_mb && ` • Max size: ${question.max_file_size_mb}MB`}
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            accept={question.allowed_file_types?.split(',').map(t => `.${t.trim()}`).join(',')}
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              {selectedFile ? (
                <>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : existingFileUrl ? (
                <>
                  <p className="font-medium">Uploaded file</p>
                  <p className="text-sm text-muted-foreground">
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View file
                    </a>
                  </p>
                </>
              ) : null}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={removeFile}
            disabled={uploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Generic Question Component
function QuestionComponent({ question, answer, onAnswerChange, onFileUpload, onFileDelete }: QuestionComponentProps) {
  switch (question.question_type) {
    case "text":
    case "essay":
    case "reflection":
    case "ministry_plan":
    case "theological_position":
    case "case_study":
    case "sermon_outline":
      return <TextQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    case "yes_no":
      return <YesNoQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    case "single_choice":
      return <SingleChoiceQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    case "multiple_choice":
      return <MultipleChoiceQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    case "scripture_reference":
      return <ScriptureReferenceQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    case "document_upload":
      return <FileUploadQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} onFileUpload={onFileUpload} onFileDelete={onFileDelete} />;
    default:
      return <TextQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
  }
}

export default QuestionComponent;