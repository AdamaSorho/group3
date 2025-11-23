import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import "./App.css";
import {
  getCoreActivities,
  getDestinationBlueprints,
  getFeelingOptions,
  getQuestionBank,
  requestChat,
  requestItinerary,
} from "./api";

const initialMessage = {
  id: "intro",
  sender: "assistant",
  text: "Hi! Tell me how you want this trip to feel and I’ll co-create a thoughtful itinerary with you.",
};

const buildAssistantReply = (text, feelings) => {
  const lower = text.toLowerCase();
  if (lower.includes("beach")) {
    return "You mentioned beaches—I’ll lean toward coastal walks and gentle tides.";
  }
  if (lower.includes("budget")) {
    return "Noted on the budget guardrails. I’ll celebrate smart hacks without feeling cheap.";
  }
  if (lower.includes("family") || lower.includes("kids")) {
    return "Sweet! I’ll tuck in conversation starters and zero-stress transitions for the family.";
  }
  if (feelings.includes("adventure")) {
    return "Adventure energy locked in! Expect micro-challenges balanced with recovery pockets.";
  }
  return "Got it. Keep sharing anything that feels true and I’ll keep shaping the vibe.";
};

const summarizePreferences = (feelings, answers) => {
  const chips = [];
  if (feelings.length) {
    chips.push(`${feelings.length} vibe tags selected`);
  }
  if (answers.climate) {
    chips.push(`${answers.climate} weather`);
  }
  if (answers.budget) {
    chips.push(`${answers.budget} budget`);
  }
  if (answers.destination) {
    chips.push(`Near ${answers.destination}`);
  }
  return chips;
};

function App() {
  const [staticData, setStaticData] = useState({
    feelingOptions: [],
    questionBank: [],
    destinationBlueprints: [],
    coreActivities: {},
  });
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [messages, setMessages] = useState([initialMessage]);
  const [inputValue, setInputValue] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [editablePlan, setEditablePlan] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [serverData, setServerData] = useState({
    itineraryText: "",
    activitySuggestions: "",
    usefulLinks: [],
    weatherForecast: "",
    packingList: "",
    foodCultureInfo: "",
    chatHistory: [],
  });

  const {
    feelingOptions,
    questionBank,
    destinationBlueprints,
    coreActivities,
  } = staticData;

  const activeQuestions = useMemo(
    () =>
      questionBank.filter((question) => {
        if (!question.dependsOn) {
          return true;
        }
        const { field, value } = question.dependsOn;
        if (field === "feelings") {
          return selectedFeelings.includes(value);
        }
        return true;
      }),
    [selectedFeelings, questionBank]
  );
  const currentQuestion = activeQuestions[questionIndex];
  const preferenceChips = summarizePreferences(selectedFeelings, answers);
  const readyForPlan =
    selectedFeelings.length > 0 &&
    (!currentQuestion || questionIndex >= activeQuestions.length);

  useEffect(() => {
    async function loadStaticData() {
      try {
        const [
          feelingOptions,
          questionBank,
          destinationBlueprints,
          coreActivities,
        ] = await Promise.all([
          getFeelingOptions(),
          getQuestionBank(),
          getDestinationBlueprints(),
          getCoreActivities(),
        ]);
        setStaticData({
          feelingOptions,
          questionBank,
          destinationBlueprints,
          coreActivities,
        });
      } catch (err) {
        setError(err.message || "Unable to load static data.");
      } finally {
        setLoadingStatic(false);
      }
    }
    loadStaticData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) =>
        prev ? `${prev} ${transcript}` : transcript
      );
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setSpeechSupported(true);
    return () => recognition.stop();
  }, []);

  useEffect(() => {
    if (questionIndex > activeQuestions.length) {
      setQuestionIndex(activeQuestions.length);
    }
  }, [activeQuestions.length, questionIndex]);

  useEffect(() => {
    if (itinerary) {
      setEditablePlan(itinerary.dailyPlan);
    }
  }, [itinerary]);

  const buildPreferencesPayload = useCallback(
    (destinationOverride) => ({
      destination: destinationOverride || answers.destination || "",
      travelDates: answers.travelDates || "",
      climate: answers.climate || "",
      pace: answers.pace || "",
      kidFriendly: answers.kidFriendly || "",
      mobility: answers.mobility || "",
      budget_type: answers.budget || "",
      goal: answers.goal || "",
      feelings: selectedFeelings,
      raw_answers: answers,
    }),
    [answers, selectedFeelings]
  );

  const handleFeelingToggle = (option) => {
    setSelectedFeelings((prev) => {
      const exists = prev.includes(option.id);
      if (exists) {
        return prev.filter((id) => id !== option.id);
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `${option.id}-${Date.now()}`,
          sender: "assistant",
          text: `Noted. I’ll add ${option.label.toLowerCase()} details, like ${option.description.toLowerCase()}.`,
        },
      ]);
      return [...prev, option.id];
    });
  };

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: trimmed,
    };
    setMessages((prevState) => [...prevState, userMessage]);
    setInputValue("");
    setLoadingChat(true);
    setError("");
    try {
      const response = await requestChat({
        preferences: buildPreferencesPayload(itinerary?.destination),
        itinerary: serverData.itineraryText || itinerary?.overview || "",
        chatHistory: serverData.chatHistory,
        question: trimmed,
      });
      const assistantReply =
        response.chat_response ||
        buildAssistantReply(trimmed, selectedFeelings);
      setServerData((prev) => ({
        ...prev,
        chatHistory: response.chat_history || prev.chatHistory,
      }));
      setMessages((prevState) => [
        ...prevState,
        { id: `${Date.now()}-reply`, sender: "assistant", text: assistantReply },
      ]);
    } catch (err) {
      setError(err.message || "Unable to get a response right now.");
      setMessages((prevState) => [
        ...prevState,
        {
          id: `${Date.now()}-fallback`,
          sender: "assistant",
          text: buildAssistantReply(trimmed, selectedFeelings),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleQuestionAnswer = (value) => {
    if (!currentQuestion) return;
    const resolvedValue =
      value ?? questionInput.trim();
    if (!resolvedValue) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: resolvedValue }));
    setQuestionInput("");
    setQuestionIndex((prev) => prev + 1);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `${currentQuestion.id}-${Date.now()}`,
        sender: "assistant",
        text: `Perfect. Logged: ${currentQuestion.question
          .replace("?", "")
          .toLowerCase()} → ${resolvedValue}.`,
      },
    ]);
  };

  const handleGenerateItinerary = async () => {
    setError("");
    setLoadingPlan(true);
    const destinationForApi = answers.destination || "your destination";
    try {
      const backendResult = await requestItinerary(
        buildPreferencesPayload(destinationForApi)
      );
      setServerData({
        itineraryText: backendResult.itinerary?.text || "",
        activitySuggestions: backendResult.activity_suggestions || "",
        usefulLinks: backendResult.useful_links || [],
        weatherForecast: backendResult.weather_forecast || "",
        packingList: backendResult.packing_list || "",
        foodCultureInfo: backendResult.food_culture_info || "",
        chatHistory: backendResult.chat_history || [],
      });

      const blueprint =
        destinationBlueprints.find(
          (bp) =>
            bp.destination.toLowerCase() ===
            (backendResult.preferences?.destination?.toLowerCase() || "")
        ) || destinationBlueprints[0];

      const dailyPlan = backendResult.itinerary?.days || [];

      const gifFallback =
        staticData.feelingOptions.find((f) => f.id === selectedFeelings[0])
          ?.gif || "https://media.giphy.com/media/l41lISBV5k3u1Q4Fa/giphy.gif";
    const moodImages =
      staticData.feelingOptions.find((f) => f.id === selectedFeelings[0])
        ?.moodImages ||
      staticData.feelingOptions
        .flatMap((option) => option.moodImages)
        .slice(0, 2);
    const finalDestination = answers.destination || blueprint.destination;
    const vibeSummary = selectedFeelings.length
      ? selectedFeelings.join(", ")
      : "balanced";
    const itineraryPayload = {
      destination: finalDestination,
      overview: `A ${dailyPlan.length}-day plan in ${finalDestination} emphasizing ${vibeSummary} energy.`,
      description: blueprint.description,
      gifUrl: gifFallback,
      mapAnchor: blueprint.mapAnchor,
      highlight: blueprint.highlight,
      dailyPlan,
      moodImages,
      preferences: preferenceChips,
    };
    setItinerary(itineraryPayload);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `plan-${Date.now()}`,
        sender: "assistant",
        text: `Here’s a plan for ${finalDestination}. Feel free to reorder activities or download the Excel itinerary.`,
      },
    ]);
    } catch (err) {
      setError(err.message || "Unable to reach the itinerary service.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleMoveActivity = (dayIndex, activityIndex, direction) => {
    setEditablePlan((prevPlan) => {
      const planClone = prevPlan.map((day) => ({
        ...day,
        activities: [...day.activities],
      }));
      const day = planClone[dayIndex];
      const newIndex = activityIndex + direction;
      if (newIndex < 0 || newIndex >= day.activities.length) return prevPlan;
      const [removed] = day.activities.splice(activityIndex, 1);
      day.activities.splice(newIndex, 0, removed);
      return planClone;
    });
  };

  const handleExport = () => {
    if (!itinerary) return;
    const rows = editablePlan.flatMap((day) =>
      day.activities.map((activity) => ({
        Day: day.day,
        Focus: day.focus,
        Time: activity.time,
        Activity: activity.title,
        Detail: activity.detail,
        Notes: activity.notes,
        Map: activity.mapLink,
      }))
    );
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Itinerary");
    writeFile(workbook, "travel-itinerary.xlsx");
  };

  const handleReset = () => {
    setSelectedFeelings([]);
    setAnswers({});
    setQuestionIndex(0);
    setQuestionInput("");
    setItinerary(null);
    setEditablePlan([]);
    setMessages([initialMessage]);
    setServerData({
      itineraryText: "",
      activitySuggestions: "",
      usefulLinks: [],
      weatherForecast: "",
      packingList: "",
      foodCultureInfo: "",
      chatHistory: [],
    });
    setError("");
  };

  const handleVoiceToggle = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      return;
    }
    recognitionRef.current.start();
    setListening(true);
  };

  const steps = [
    {
      id: "feel",
      label: "Feelings",
      complete: selectedFeelings.length > 0,
    },
    {
      id: "context",
      label: "Context",
      complete:
        activeQuestions.length > 0 &&
        questionIndex >= activeQuestions.length,
    },
    {
      id: "plan",
      label: "Itinerary",
      complete: Boolean(itinerary),
    },
  ];

  if (loadingStatic) {
    return (
      <div className="app-shell">
        <header className="hero">
          <div>
            <p className="eyebrow">Travel Itinerary Lab · Group 3</p>
            <h1>Plan by feeling, not by pin.</h1>
            <p className="lead">Loading planner configuration...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Travel Itinerary Lab · Group 3</p>
          <h1>Plan by feeling, not by pin.</h1>
          <p className="lead">
            Use conversation, playful UI, and adaptive questions to co-design a
            thoughtful travel plan. We focus on delight and progressive
            disclosure so you never feel overwhelmed.
          </p>
          <div className="hero-actions">
            <button
              className="primary"
              onClick={handleGenerateItinerary}
              disabled={!readyForPlan || loadingPlan || loadingStatic}
            >
              {loadingPlan ? "Generating..." : "Generate itinerary"}
            </button>
            <button className="ghost" onClick={handleReset}>
              Reset journey
            </button>
          </div>
        </div>
        {itinerary && (
          <div className="hero-badge">
            <p>Next stop</p>
            <h3>{itinerary.destination}</h3>
            <p>{itinerary.description}</p>
          </div>
        )}
      </header>

      <section className="progress">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`progress-step ${step.complete ? "complete" : ""}`}
          >
            <span>{step.label}</span>
          </div>
        ))}
      </section>

      <main className="grid">
        <section className="panel">
          <h2>Choose the feelings</h2>
          <p className="panel-subtitle">
            Pick as many as you like—these are our design constraints.
          </p>
          <div className="feeling-grid">
            {feelingOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`feeling-card ${
                  selectedFeelings.includes(option.id) ? "active" : ""
                }`}
                style={{ borderColor: option.color }}
                onClick={() => handleFeelingToggle(option)}
              >
                <div className="feeling-card-accent" style={{ background: option.color }} />
                <div>
                  <h3>{option.label}</h3>
                  <p>{option.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="question-card">
            <div className="question-header">
              <p>Adaptive questions</p>
              {currentQuestion ? (
                <span>
                  {questionIndex + 1}/{activeQuestions.length}
                </span>
              ) : (
                <span>All set</span>
              )}
            </div>
            {currentQuestion ? (
              <div>
                <h3>
                  {currentQuestion.icon} {currentQuestion.question}
                </h3>
                {currentQuestion.helper && (
                  <p className="helper">{currentQuestion.helper}</p>
                )}
                {currentQuestion.type === "choice" ? (
                  <div className="choice-row">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        className="chip"
                        onClick={() => handleQuestionAnswer(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleQuestionAnswer();
                    }}
                  >
                    <input
                      value={questionInput}
                      onChange={(event) => setQuestionInput(event.target.value)}
                      placeholder={currentQuestion.placeholder}
                    />
                    <button className="primary small" type="submit">
                      Save answer
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="question-complete">
                <h3>We’re ready to sketch your itinerary.</h3>
                <p>Hit “Generate itinerary” anytime.</p>
              </div>
            )}
          </div>

          {preferenceChips.length > 0 && (
            <div className="preference-summary">
              <h4>Preference summary</h4>
              <div className="chip-row">
                {preferenceChips.map((chip) => (
                  <span key={chip} className="chip muted">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="panel conversation">
          <h2>Conversational co-creation</h2>
          <p className="panel-subtitle">
            Type or speak what matters. I’ll ask follow-ups and remix the plan.
          </p>
          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender}`}
              >
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="composer">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Share constraints, secret wishes, or deal-breakers…"
            />
            <div className="composer-actions">
              <button
                type="button"
                className={`mic ${listening ? "active" : ""}`}
                onClick={handleVoiceToggle}
                disabled={!speechSupported}
                title={
                  speechSupported
                    ? "Hold a quick voice note"
                    : "Voice input not supported in this browser"
                }
              >
                🎙️
              </button>
              <button className="primary" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        </section>
      </main>

      {itinerary && (
        <section className="panel itinerary">
          <div className="itinerary-header">
            <div>
              <h2>Your personalized itinerary</h2>
              <p>{itinerary.overview}</p>
            </div>
            <div className="itinerary-actions">
              <button className="ghost" onClick={handleExport}>
                Download Excel
              </button>
              <button
                className="primary"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      itinerary.mapAnchor
                    )}`,
                    "_blank"
                  )
                }
              >
                Open map
              </button>
            </div>
          </div>

          <div className="multimodal">
            <div className="gif-card">
              <p>Trip vibe</p>
              <img src={itinerary.gifUrl} alt="Trip vibe gif" />
            </div>
            <div className="mood-board">
              <p>Your trip looks like…</p>
              <div className="mood-grid">
                {itinerary.moodImages.map((url, idx) => (
                  <img key={url + idx} src={url} alt="Mood board" />
                ))}
              </div>
            </div>
            <div className="highlight">
              <p>Signature moment</p>
              <h3>{itinerary.highlight}</h3>
              <ul>
                {editablePlan.flatMap((day) =>
                  day.activities.slice(0, 1).map((activity) => (
                    <li key={`${day.day}-${activity.title}`}>
                      <a href={activity.mapLink} target="_blank" rel="noreferrer">
                        {activity.title}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="plan-grid">
            {editablePlan.map((day, dayIndex) => (
              <div key={day.day} className="day-card">
                <div className="day-header">
                  <div>
                    <p className="eyebrow">{day.day}</p>
                    <h3>{day.focus}</h3>
                  </div>
                </div>
                <ul>
                  {day.activities.map((activity, activityIndex) => (
                    <li key={`${activity.title}-${activity.time}`}>
                      <div>
                        <p className="eyebrow">{activity.time}</p>
                        <h4>{activity.title}</h4>
                        <p>{activity.detail}</p>
                        <div className="map-links">
                          <a
                            href={activity.mapLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Map / distance
                          </a>
                          <span>{activity.notes}</span>
                        </div>
                      </div>
                      <div className="reorder">
                        <button
                          onClick={() =>
                            handleMoveActivity(dayIndex, activityIndex, -1)
                          }
                          disabled={activityIndex === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() =>
                            handleMoveActivity(dayIndex, activityIndex, 1)
                          }
                          disabled={activityIndex === day.activities.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
