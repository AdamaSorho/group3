import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import "./App.css";
import { requestChat, requestItinerary } from "./api";

const feelingOptions = [
  {
    id: "relax",
    label: "Relaxed / Peaceful",
    description: "Slow mornings, spa rituals, gentle nature.",
    color: "#79c7b4",
    gif: "https://media.giphy.com/media/l4KhQo2MESJkc6QbS/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    id: "adventure",
    label: "Adventure / Thrill",
    description: "Hikes, cliffs, adrenaline and bold colors.",
    color: "#fe8c69",
    gif: "https://media.giphy.com/media/3o6Zt7AC5JXRa1lEve/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    id: "reconnect",
    label: "Reconnection",
    description: "Friends, family, cozy shared experiences.",
    color: "#fbb14b",
    gif: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    id: "food",
    label: "Food Exploration",
    description: "Markets, chef tables, spice routes.",
    color: "#f07c82",
    gif: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    id: "budget",
    label: "Budget-Friendly",
    description: "Smart hacks, local gems, shared transit.",
    color: "#8c9eff",
    gif: "https://media.giphy.com/media/3ornk57KwDXf81rjWM/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1489365091240-6a18fc761ec2?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    id: "celebrate",
    label: "Celebration",
    description: "Sparkle, hidden rooftops, surprise moments.",
    color: "#d0a5ff",
    gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    moodImages: [
      "https://images.unsplash.com/photo-1486428263684-5413e434ad35?auto=format&fit=crop&w=600&q=60",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60",
    ],
  },
];

const questionBank = [
  {
    id: "travelDates",
    icon: "🗓️",
    question: "When are you hoping to travel?",
    type: "text",
    placeholder: "e.g., June 5 – 10, 2025",
    helper: "We’ll keep weather and seasonal vibes in mind.",
  },
  {
    id: "climate",
    icon: "🌡️",
    question: "Are you leaning toward cooler or warmer weather?",
    type: "choice",
    options: ["Cooler", "Warmer", "Surprise me"],
  },
  {
    id: "pace",
    icon: "⏰",
    question: "What pace feels right on this trip?",
    type: "choice",
    options: ["Slow + mindful", "Balanced mix", "High-energy"],
  },
  {
    id: "kidFriendly",
    icon: "🧒",
    question: "Should we include kid-friendly activities?",
    type: "choice",
    options: ["Definitely", "Not needed"],
    dependsOn: (feelings) => feelings.includes("reconnect"),
  },
  {
    id: "mobility",
    icon: "🧭",
    question: "How much moving around is comfortable?",
    type: "choice",
    options: ["Keep it close", "Happy to explore"],
  },
  {
    id: "budget",
    icon: "💰",
    question: "How should we treat the budget?",
    type: "choice",
    options: ["Budget-friendly", "Balanced", "All-out celebration"],
  },
  {
    id: "goal",
    icon: "🎯",
    question: "Any personal story or goal we should honor?",
    type: "text",
    placeholder: "e.g., celebrating a promotion",
  },
  {
    id: "destination",
    icon: "📍",
    question: "Already have a destination or neighborhood?",
    type: "text",
    placeholder: "Optional: e.g., south Maui near Wailea",
  },
];

const destinationBlueprints = [
  {
    id: "bali",
    destination: "Ubud, Bali",
    feelings: ["relax", "reconnect", "celebrate"],
    climate: "warmer",
    budget: "balanced",
    description:
      "Jungle villas, sunrise rice fields, spa rituals, and candlelit dinners.",
    mapAnchor: "Ubud Bali",
    highlight: "waterfall meditation and floating breakfast",
  },
  {
    id: "azores",
    destination: "São Miguel, Azores",
    feelings: ["adventure", "budget"],
    climate: "cooler",
    budget: "budget-friendly",
    description:
      "Crater lakes, cliff-side hikes, geothermal pools, and whale watching.",
    mapAnchor: "Sete Cidades Azores",
    highlight: "volcanic hot springs under the stars",
  },
  {
    id: "lisbon",
    destination: "Lisbon & Cascais, Portugal",
    feelings: ["food", "celebrate", "budget"],
    climate: "warmer",
    budget: "balanced",
    description:
      "Tile-covered alleys, pastel de nata crawls, coastal sunset picnics.",
    mapAnchor: "Time Out Market Lisbon",
    highlight: "chef-led market tasting trail",
  },
  {
    id: "banff",
    destination: "Banff & Lake Louise, Canada",
    feelings: ["adventure", "reconnect"],
    climate: "cooler",
    budget: "balanced",
    description:
      "Glacial lakes, gondola sunsets, alpine picnics, and cozy fireside chats.",
    mapAnchor: "Lake Louise",
    highlight: "canoe ride with hot cocoa stop",
  },
];

const coreActivities = {
  relax: [
    {
      title: "Morning forest bathing",
      detail: "Guided breathing walk between rice terraces.",
      mapQuery: "Campuhan Ridge Walk",
    },
    {
      title: "Spa + herbal compresses",
      detail: "Choose a Balinese massage with jasmine oils.",
      mapQuery: "Ubud spa",
    },
    {
      title: "Floating brunch",
      detail: "Indulge in tropical fruit platters and made-to-order crepes.",
      mapQuery: "Kayon Jungle Resort",
    },
    {
      title: "Sunset sound bath",
      detail: "Chimes + bowls while lanterns glow above the jungle.",
      mapQuery: "Pyramids of Chi",
    },
  ],
  adventure: [
    {
      title: "Dawn ridge hike",
      detail: "4-mile ridge trail before the clouds roll in.",
      mapQuery: "Miradouro da Boca do Inferno Azores",
    },
    {
      title: "Coasteering splash",
      detail: "Guided cliff jumps with wet suit + GoPro footage.",
      mapQuery: "Azores coasteering",
    },
    {
      title: "Mountain biking",
      detail: "Flowy single track through spruce forests.",
      mapQuery: "Banff mountain biking",
    },
    {
      title: "Thermal night soak",
      detail: "Recharge with star-filled geothermal pools.",
      mapQuery: "Caldeira Velha",
    },
  ],
  reconnect: [
    {
      title: "Family storytelling brunch",
      detail: "Prompt cards + shared playlists.",
      mapQuery: "Lisbon brunch cafes",
    },
    {
      title: "Hands-on cooking lab",
      detail: "Teach the kids to fold dumplings or pasteis.",
      mapQuery: "Lisbon cooking class",
    },
    {
      title: "Analog game night",
      detail: "Retro board games delivered to your stay.",
      mapQuery: "Lisbon board game cafe",
    },
  ],
  food: [
    {
      title: "Market tasting trail",
      detail: "Chef-led tour with at least six sweet + savory bites.",
      mapQuery: "Time Out Market",
    },
    {
      title: "Neighborhood food crawl",
      detail: "Walkable bites through pastel facades.",
      mapQuery: "Alfama Lisbon food",
    },
    {
      title: "Winemaker sunset table",
      detail: "Small vineyard dinner overlooking the coast.",
      mapQuery: "Sintra vineyard dinner",
    },
  ],
  budget: [
    {
      title: "DIY biking tour",
      detail: "Rent bikes + follow our downloaded voice guide.",
      mapQuery: "Lisbon bike rental",
    },
    {
      title: "Street food picnic",
      detail: "Market snacks paired with reusable plates + cutlery.",
      mapQuery: "Lisbon street food",
    },
  ],
  celebrate: [
    {
      title: "Private rooftop toast",
      detail: "String lights, playlist, polaroid station.",
      mapQuery: "Lisbon rooftop bar",
    },
    {
      title: "Secret supper",
      detail: "Chef invites you to an unlisted tasting counter.",
      mapQuery: "Lisbon secret supper club",
    },
  ],
};

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

const selectBlueprint = (feelings, answers) => {
  if (!feelings.length) return destinationBlueprints[0];
  let best = destinationBlueprints[0];
  let bestScore = -1;
  destinationBlueprints.forEach((blueprint) => {
    let score = 0;
    feelings.forEach((f) => {
      if (blueprint.feelings.includes(f)) score += 2;
    });
    if (
      answers.climate &&
      blueprint.climate === answers.climate.toLowerCase()
    ) {
      score += 1;
    }
    if (
      answers.budget &&
      blueprint.budget === answers.budget.toLowerCase()
    ) {
      score += 1;
    }
    if (score > bestScore) {
      best = blueprint;
      bestScore = score;
    }
  });
  return best;
};

const buildDailyPlan = (feelings, blueprint, answers) => {
  const prioritizedFeelings = feelings.length
    ? feelings
    : ["relax", "food", "adventure"];
  const plan = [];
  const timeBlocks = ["Morning", "Afternoon", "Evening"];
  for (let day = 1; day <= 3; day += 1) {
    const activities = [];
    timeBlocks.forEach((block, idx) => {
      const feelingKey =
        prioritizedFeelings[(day + idx - 1) % prioritizedFeelings.length];
      const pool = coreActivities[feelingKey] ?? [];
      const activity = pool[(day + idx) % pool.length];
      if (activity) {
        activities.push({
          ...activity,
          time: block,
          notes:
            answers.mobility === "Keep it close"
              ? "Within a 15-minute ride"
              : "Expect light transit",
          mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            activity.mapQuery
          )}`,
        });
      }
    });
    plan.push({
      day: `Day ${day}`,
      focus:
        day === 1
          ? "Arrival & orientation"
          : day === 2
          ? "Deep dive moments"
          : "Wrap-up with delight",
      activities,
    });
  }
  return plan;
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

  const activeQuestions = useMemo(
    () =>
      questionBank.filter(
        (question) =>
          !question.dependsOn || question.dependsOn(selectedFeelings)
      ),
    [selectedFeelings]
  );
  const currentQuestion = activeQuestions[questionIndex];
  const preferenceChips = summarizePreferences(selectedFeelings, answers);
  const readyForPlan =
    selectedFeelings.length > 0 &&
    (!currentQuestion || questionIndex >= activeQuestions.length);

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

  const renderServerText = (text, emptyLabel) => {
    if (!text) {
      return <p className="muted-text">{emptyLabel}</p>;
    }
    return text
      .split(/\n+/)
      .filter(Boolean)
      .map((line, idx) => <p key={`${emptyLabel}-${idx}`}>{line}</p>);
  };

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
    const blueprint = selectBlueprint(selectedFeelings, answers);
    const dailyPlan = buildDailyPlan(selectedFeelings, blueprint, answers);
    const gifFallback =
      feelingOptions.find((f) => f.id === selectedFeelings[0])?.gif ||
      "https://media.giphy.com/media/l41lISBV5k3u1Q4Fa/giphy.gif";
    const moodImages =
      feelingOptions.find((f) => f.id === selectedFeelings[0])?.moodImages ||
      feelingOptions.flatMap((option) => option.moodImages).slice(0, 2);
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
    try {
      const backendResult = await requestItinerary(
        buildPreferencesPayload(finalDestination)
      );
      setServerData({
        itineraryText: backendResult.itinerary || "",
        activitySuggestions: backendResult.activity_suggestions || "",
        usefulLinks: backendResult.useful_links || [],
        weatherForecast: backendResult.weather_forecast || "",
        packingList: backendResult.packing_list || "",
        foodCultureInfo: backendResult.food_culture_info || "",
        chatHistory: backendResult.chat_history || [],
      });
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

  const hasServerInsights =
    serverData.itineraryText ||
    serverData.activitySuggestions ||
    serverData.usefulLinks.length > 0 ||
    serverData.weatherForecast ||
    serverData.packingList ||
    serverData.foodCultureInfo;

  return (
    <div className="app-shell">
      {error && <div className="error-banner">{error}</div>}
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
              disabled={!readyForPlan || loadingPlan}
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

          <div className="server-section">
            <div className="server-header">
              <p className="eyebrow">Backend intelligence</p>
              <h3>Agent-generated details</h3>
              <p className="panel-subtitle">
                Live outputs from the backend workflow that complement the UI plan.
              </p>
              {!hasServerInsights && !loadingPlan && (
                <p className="muted-text">
                  Generate an itinerary to pull in weather, packing, and activity insights.
                </p>
              )}
            </div>
            <div className="server-grid">
              <div className="server-card">
                <h4>Text itinerary</h4>
                {renderServerText(
                  serverData.itineraryText,
                  loadingPlan
                    ? "Fetching itinerary from backend agents..."
                    : "Backend itinerary will appear here."
                )}
              </div>
              <div className="server-card">
                <h4>Activities + add-ons</h4>
                {renderServerText(
                  serverData.activitySuggestions,
                  loadingPlan
                    ? "Requesting tailored activity ideas..."
                    : "Backend activities will appear here."
                )}
              </div>
              <div className="server-card">
                <h4>Weather forecast</h4>
                {renderServerText(
                  serverData.weatherForecast,
                  loadingPlan
                    ? "Checking the latest forecast..."
                    : "Backend weather notes will appear here."
                )}
              </div>
              <div className="server-card">
                <h4>Packing list</h4>
                {renderServerText(
                  serverData.packingList,
                  loadingPlan
                    ? "Drafting a packing list..."
                    : "Backend packing tips will appear here."
                )}
              </div>
              <div className="server-card">
                <h4>Food + culture</h4>
                {renderServerText(
                  serverData.foodCultureInfo,
                  loadingPlan
                    ? "Researching cultural notes..."
                    : "Backend food and culture tips will appear here."
                )}
              </div>
              <div className="server-card">
                <h4>Useful links</h4>
                {serverData.usefulLinks.length > 0 ? (
                  <ul>
                    {serverData.usefulLinks.map((link, idx) => (
                      <li key={`${link.title || link.url || idx}`}>
                        <a
                          href={link.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.title || link.url || "Link"}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  renderServerText(
                    "",
                    loadingPlan
                      ? "Collecting links from the backend..."
                      : "Backend links will appear here."
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
