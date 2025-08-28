"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/tests";
import { TestDetail, TestQuestion, Answer, questionTypeInfo } from "@/types/tests";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Timer,
  Flag,
} from "lucide-react";

interface QuestionComponentProps {
  question: TestQuestion;
  answer: any;
  onAnswerChange: (answer: any) => void;
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
  const selectedValue = answer?.selected_options?.[0] || "";
  
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`question-${question.id}`}
            value="yes"
            checked={selectedValue === "yes"}
            onChange={(e) => onAnswerChange({ 
              question_id: question.id, 
              selected_options: [e.target.value] 
            })}
            className="text-primary"
          />
          <span>Yes</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={`question-${question.id}`}
            value="no"
            checked={selectedValue === "no"}
            onChange={(e) => onAnswerChange({ 
              question_id: question.id, 
              selected_options: [e.target.value] 
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
function FileUploadQuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (question.max_file_size_mb && file.size > question.max_file_size_mb * 1024 * 1024) {
        alert(`File size must be less than ${question.max_file_size_mb}MB`);
        return;
      }
      
      // Check file type
      if (question.allowed_file_types) {
        const allowedTypes = question.allowed_file_types.split(',').map(t => t.trim().toLowerCase());
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension && !allowedTypes.includes(fileExtension)) {
          alert(`File type not allowed. Allowed types: ${question.allowed_file_types}`);
          return;
        }
      }
      
      setSelectedFile(file);
      onAnswerChange({
        question_id: question.id,
        file_upload: file,
      });
    }
  };
  
  const removeFile = () => {
    setSelectedFile(null);
    onAnswerChange({
      question_id: question.id,
      file_upload: undefined,
    });
  };
  
  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Click to upload a file</p>
            <p className="text-xs text-muted-foreground">
              {question.allowed_file_types && `Allowed: ${question.allowed_file_types}`}
              {question.max_file_size_mb && ` • Max size: ${question.max_file_size_mb}MB`}
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={question.allowed_file_types?.split(',').map(t => `.${t.trim()}`).join(',')}
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Generic Question Component
function QuestionComponent({ question, answer, onAnswerChange }: QuestionComponentProps) {
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
      return <FileUploadQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
    default:
      return <TextQuestionComponent question={question} answer={answer} onAnswerChange={onAnswerChange} />;
  }
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = parseInt(params.id as string);
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const { getTestDetailsForUI } = useTests();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const testData = await getTestDetailsForUI(testId);
        setTest(testData);
        
        // Initialize time remaining if test has time limit
        if (testData.time_limit_minutes) {
          setTimeRemaining(testData.time_limit_minutes * 60); // Convert to seconds
        }
      } catch (err) {
        console.error("Failed to fetch test:", err);
        setError("Failed to load test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (testId && !isNaN(testId)) {
      fetchTest();
    } else {
      setError("Invalid test ID");
      setLoading(false);
    }
  }, [testId, getTestDetailsForUI]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFlagQuestion = () => {
    if (!test) return;
    const questionId = test.questions[currentQuestionIndex].id;
    const newFlagged = new Set(flaggedQuestions);
    
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    
    setFlaggedQuestions(newFlagged);
  };

  const handleSaveTest = () => {
    // TODO: Implement save test functionality
    console.log("Saving test...", answers);
    // This would typically send a request to save the current answers
  };

  const handleSubmitTest = () => {
    // TODO: Implement submit test functionality
    console.log("Submitting test...", answers);
    // This would typically send a request to submit the test
    // For now, redirect back to test details
    router.push(`/tests/${testId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !test) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Test not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">{test.title}</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                {answeredQuestions} / {test.questions.length} answered
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Question Navigation Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-1 gap-2">
                  {test.questions.map((q, index) => (
                    <Button
                      key={q.id}
                      variant={index === currentQuestionIndex ? "default" : "outline"}
                      size="sm"
                      className={`relative ${answers[q.id] ? 'ring-2 ring-green-200' : ''}`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                      {flaggedQuestions.has(q.id) && (
                        <Flag className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
                      )}
                      {answers[q.id] && (
                        <CheckCircle className="h-3 w-3 absolute -bottom-1 -right-1 text-green-600" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {questionTypeInfo[currentQuestion.question_type].label}
                      </Badge>
                      {currentQuestion.is_required && (
                        <Badge variant="outline" className="text-red-600">
                          Required
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFlagQuestion}
                    className={flaggedQuestions.has(currentQuestion.id) ? 'bg-red-50' : ''}
                  >
                    <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestion.id) ? 'text-red-500' : ''}`} />
                  </Button>
                </div>
                
                {currentQuestion.description && (
                  <p className="text-muted-foreground">{currentQuestion.description}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <QuestionComponent
                  question={currentQuestion}
                  answer={currentAnswer}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSaveTest}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
                
                {currentQuestionIndex === test.questions.length - 1 ? (
                  <Button onClick={handleSubmitTest}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Test
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
