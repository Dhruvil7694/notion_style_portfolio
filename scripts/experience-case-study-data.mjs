/**
 * Structured case-study seed content for experience detail pages.
 * Source: resume (AI_Engineer_Dhruvil_Patel.pdf) + GitHub (Dhruvil7694)
 */

/** @type {Record<string, import("../src/features/portfolio/lib/experience-case-study").ExperienceCaseStudy>} */
export const EXPERIENCE_CASE_STUDY_BY_COMPANY = {
  "1POINT1": {
    hire_summary:
      "Ship production AI systems that non-technical teams can rely on daily — NL-to-SQL reporting, document intelligence, and automation pipelines with guardrails, not demo-only prototypes.",
    hire_scope: [
      "Own NL-to-SQL, document intelligence, and large-scale document automation from design through production rollout.",
      "Build schema-aware guardrails, hybrid extraction pipelines, and concurrent processing for enterprise unstructured data.",
      "Partner with sales, ops, and engineering stakeholders to align AI capabilities with forecasting and deal-visibility workflows.",
    ],
    hire_ownership: [
      "Solution architecture, API design, and implementation",
      "Prompt/guardrail design and validation layers for generated SQL and extracted fields",
      "Pipeline performance, failure handling, and rollout to business users",
    ],
    hire_context: [
      "Enterprise reporting depended on analysts for routine database queries.",
      "Bidding and contract documents were reviewed manually at 1,000+ page scale.",
      "Production reliability and latency mattered more than model novelty.",
    ],
    business_problems: [
      "Sales and ops teams could not query PostgreSQL, MySQL, or MSSQL without analyst support — slowing forecasting and reporting.",
      "Enterprise bidding documents required manual review of 80+ structured fields per contract, hurting deal visibility.",
      "1,000+ page PDF workflows took 1–2 hours per file, creating administrative overhead for sales teams.",
      "Quality inspection workflows needed a scalable computer-vision path across many defect categories.",
      "Large unstructured datasets needed concurrent processing without sacrificing latency or reliability.",
    ],
    projects: [
      {
        name: "NL→SQL Enterprise Reporting Platform",
        business_problem:
          "Non-technical sales and ops teams depended on analysts for every database report, slowing forecasting and decision-making.",
        contribution:
          "Built a schema-aware NL→SQL platform with validation guardrails enabling natural-language queries across PostgreSQL, MySQL, and MSSQL.",
        technologies:
          "Python · FastAPI · Azure OpenAI · PostgreSQL · MySQL · MSSQL",
        outcome:
          "Eliminated analyst dependency for routine enterprise reporting and accelerated forecasting workflows.",
      },
      {
        name: "Enterprise Document Intelligence (Tender / Bidding)",
        business_problem:
          "Contract and bidding review cycles were slow because 80+ structured fields had to be extracted manually from complex documents.",
        contribution:
          "Designed a hybrid AI system combining rule-based parsing with selective RAG to extract structured fields from enterprise bidding documents.",
        technologies:
          "Python · LangChain · RAG · Azure OpenAI · Azure AI Search",
        outcome:
          "Reduced contract review cycle time and improved deal visibility for sales and leadership teams.",
      },
      {
        name: "Large-Scale Document Pipeline Automation",
        business_problem:
          "Sales teams spent 1–2 hours manually handling 1,000+ page bidding files before downstream review could begin.",
        contribution:
          "Automated ingestion via parallel PDF splitting and Google Drive integration with concurrent processing pipelines.",
        technologies: "Python · Async processing · Google Drive API · FastAPI",
        outcome:
          "Processed 1,000+ page files in under 2 minutes versus 1–2 hours manually — freeing teams from administrative overhead.",
      },
      {
        name: "Automobile Defect Classification (CV POC)",
        business_problem:
          "Manual defect inspection across varied real-world conditions did not scale across 20 job categories.",
        contribution:
          "Delivered a computer-vision proof of concept for automobile defect classification with production-oriented evaluation.",
        technologies: "Python · Computer Vision · Model evaluation pipelines",
        outcome:
          "Achieved 85%+ accuracy across 20 job categories under varied real-world conditions.",
      },
      {
        name: "Enterprise Automation Processing Pipelines",
        business_problem:
          "High-volume unstructured document workloads created latency and throughput bottlenecks in automation workflows.",
        contribution:
          "Designed high-performance concurrent processing pipelines optimized for enterprise-scale unstructured datasets.",
        technologies:
          "Python · FastAPI · Concurrent/async pipelines · PostgreSQL",
        outcome:
          "Improved latency and throughput across large automation workloads while keeping operations maintainable.",
      },
    ],
    automation: [
      "Parallel PDF splitting and Google Drive ingestion for 1,000+ page enterprise bidding files (under 2 minutes end-to-end).",
      "Automated structured-field extraction workflows replacing repetitive manual contract review steps.",
      "Concurrent document processing pipelines for large unstructured datasets across automation jobs.",
      "Background job orchestration for long-running AI extraction and validation tasks.",
    ],
    systems: [
      "NL→SQL platform with schema-aware guardrails and multi-database connectivity (PostgreSQL, MySQL, MSSQL).",
      "Hybrid document intelligence system combining rule-based parsing with selective RAG retrieval.",
      "FastAPI services for document ingestion, extraction, validation, and operator-facing APIs.",
      "Concurrent processing runtime for enterprise automation across unstructured document workloads.",
    ],
    hardest_challenge: {
      challenge:
        "Making NL→SQL safe for non-technical users querying live enterprise databases without corrupting data or returning hallucinated SQL.",
      constraints: [
        "Multiple database dialects (PostgreSQL, MySQL, MSSQL) with different schema conventions.",
        "Non-technical users needed self-serve access without analyst review on every query.",
        "Generated SQL had to fail safely when schema context was ambiguous or incomplete.",
      ],
      solution: [
        "Added schema-aware guardrails, validation layers, and constrained generation paths before executing queries.",
        "Separated retrieval/context assembly from execution so bad outputs were blocked before touching production data.",
        "Designed prompts and system flows around explainability and predictable failure modes.",
      ],
      outcome: [
        "Enabled self-serve reporting for sales and ops teams while reducing analyst bottlenecks.",
        "Improved trust in AI-assisted querying through validation-first architecture.",
      ],
    },
    tradeoffs: [
      "Used schema-aware guardrails and validation layers instead of unconstrained LLM SQL generation — traded flexibility for production safety.",
      "Chose hybrid rule-based parsing + selective RAG over pure vector retrieval for document intelligence — better field accuracy on semi-structured bids.",
      "Preferred relational databases as the system of record for reporting workflows — correctness and auditability over novelty.",
      "Adopted concurrent/async pipelines for document automation — higher throughput at the cost of more operational complexity.",
      "Routed models by task complexity and cost (Azure OpenAI and supporting providers) rather than using one model for every step.",
    ],
    learnings: [
      "Production AI value comes from guardrails, validation, and workflow fit — not from swapping models alone.",
      "Hybrid extraction beats pure RAG when documents have predictable structure plus long-tail edge cases.",
      "Non-technical users need systems that fail safely; trust is built by blocking bad outputs before execution.",
      "Concurrent pipeline design early prevents painful rewrites when document volume scales.",
    ],
    impact: [
      "Eliminated analyst dependency for routine NL→SQL enterprise reporting.",
      "Reduced 1,000+ page document handling from 1–2 hours to under 2 minutes.",
      "Improved contract review speed and deal visibility via 80+ field document intelligence.",
      "Delivered 85%+ CV defect-classification accuracy across 20 job categories in POC.",
      "Increased automation throughput across large unstructured datasets.",
    ],
  },
  "Cyber Security Umbrella": {
    hire_summary:
      "Deploy GenAI and compliance systems for cybersecurity operations — real-time scenario assistants, fine-tuned regulatory mapping, and SOC analytics on production infrastructure.",
    hire_scope: [
      "Build and deploy RAG assistants, fine-tuned LLM compliance workflows, and SOC analytics ingestion pipelines.",
      "Lead delivery across a cross-functional engineering team while communicating AI capabilities to non-technical stakeholders.",
      "Ship scalable FastAPI services on AWS SageMaker with production observability and auto-scaling.",
    ],
    hire_ownership: [
      "End-to-end ML system design, training/fine-tuning workflows, and deployment",
      "RAG pipeline architecture and real-time inference APIs",
      "Team delivery coordination, testing automation, and executive-facing demos",
    ],
    hire_context: [
      "Security analysts faced tens of thousands of scenario types with slow manual triage.",
      "Regulatory mapping required high-accuracy reasoning over complex compliance text.",
      "SOC tooling produced fragmented telemetry across 6+ security products.",
    ],
    business_problems: [
      "Analysts needed faster triage across 82,000+ cybersecurity scenarios without scaling hardware aggressively.",
      "Compliance mapping and gap reasoning required higher accuracy than generic LLM prompts could provide.",
      "Security operations lacked a unified real-time view across multiple vendor tools.",
      "Production GenAI services needed to handle 1,000+ concurrent requests with predictable latency.",
      "Executive stakeholders needed understandable explanations of AI system capabilities and limits.",
    ],
    projects: [
      {
        name: "GenAI Cybersecurity Assistant",
        business_problem:
          "Security analysts spent too long manually looking up guidance across 82,000+ cybersecurity scenarios.",
        contribution:
          "Deployed a real-time GenAI assistant using RAG, LangChain, and Gemini API optimized for lightweight infrastructure.",
        technologies: "Python · LangChain · RAG · Gemini API · FastAPI",
        outcome:
          "40% faster incident triage versus manual lookup without heavy external inference dependencies for core flows.",
      },
      {
        name: "Multi-Model Compliance Mapping System",
        business_problem:
          "Regulatory mapping and gap reasoning required higher precision than zero-shot LLM prompts could reliably deliver.",
        contribution:
          "Built a multi-model compliance system using LoRA/QLoRA fine-tuned LLMs for regulatory mapping and structured reasoning.",
        technologies:
          "Python · LoRA/QLoRA · Hugging Face Transformers · FastAPI",
        outcome:
          "Achieved ~95% operational accuracy in regulatory mapping — applicable to sales qualification and competitive-intelligence-style workflows.",
      },
      {
        name: "SOC Analytics Ingestion Pipeline",
        business_problem:
          "SOC telemetry was fragmented across 6+ security tools, limiting real-time threat monitoring and anomaly detection.",
        contribution:
          "Designed a pipeline aggregating multi-vendor security data with real-time ingestion and automated threat monitoring.",
        technologies:
          "Python · FastAPI · Streaming ingestion · Anomaly detection",
        outcome:
          "Delivered unified SOC analytics architecture applicable to full-stack AI forecasting and performance monitoring patterns.",
      },
      {
        name: "AWS SageMaker Production Deployment",
        business_problem:
          "GenAI and ML services needed production-grade scaling, deployment, and API access for security operations.",
        contribution:
          "Deployed auto-scaling FastAPI endpoints on AWS SageMaker with production MLOps practices.",
        technologies: "AWS SageMaker · FastAPI · Docker · Python",
        outcome:
          "Handled 1,000+ concurrent requests with scalable production infrastructure.",
      },
      {
        name: "Enterprise File Governance & AI Assistant (Side Project)",
        business_problem:
          "Sensitive file operations across endpoints lacked centralized monitoring, policy enforcement, and operator tooling.",
        contribution:
          "Built a distributed governance platform with Windows agents, policy workflows, and an LLM operator assistant (GitHub: enterprise-style architecture).",
        technologies:
          "FastAPI · PostgreSQL · Redis · LLM tool-calling · SSE · RBAC",
        outcome:
          "Demonstrated production patterns for human-in-the-loop AI control, auditability, and real-time operator assistance.",
      },
    ],
    automation: [
      "Automated cybersecurity scenario triage via RAG assistant — 40% faster than manual lookup.",
      "SOC ingestion automation across 6+ security tools with real-time anomaly monitoring.",
      "Agile ML delivery workflows with automated testing, accelerating team delivery by 25%.",
      "Auto-scaling deployment pipelines for FastAPI inference services on AWS SageMaker.",
    ],
    systems: [
      "Real-time GenAI assistant architecture (RAG + LangChain + Gemini API) for scenario triage.",
      "Fine-tuned multi-model compliance system with LoRA/QLoRA training and evaluation loops.",
      "SOC analytics aggregation layer with streaming ingestion and threat monitoring.",
      "Production FastAPI inference platform on AWS SageMaker with auto-scaling endpoints.",
    ],
    hardest_challenge: {
      challenge:
        "Delivering useful GenAI triage across 82,000+ cybersecurity scenarios on lightweight infrastructure without unacceptable latency or cost.",
      constraints: [
        "Large scenario corpus with heterogeneous formats and overlapping guidance.",
        "Need for real-time responses during active incident handling.",
        "Limited appetite for expensive always-on external inference for core workflows.",
      ],
      solution: [
        "Built a RAG pipeline with retrieval tuned for scenario lookup rather than generic chat.",
        "Used LangChain orchestration with task-specific prompts and response constraints.",
        "Deployed on AWS SageMaker with auto-scaling FastAPI endpoints for production traffic.",
      ],
      outcome: [
        "40% faster incident triage versus manual lookup.",
        "Production deployment supporting 1,000+ concurrent requests.",
      ],
    },
    tradeoffs: [
      "Fine-tuned LoRA/QLoRA models for compliance accuracy instead of relying on prompt-only GPT-style flows.",
      "Used RAG for scenario lookup breadth while keeping inference infrastructure lean for core triage paths.",
      "Chose SageMaker-managed scaling over bespoke servers — faster production path, higher cloud coupling.",
      "Prioritized operational accuracy (~95%) and auditability over demo-friendly open-ended chat behavior.",
      "Invested in automated testing and agile ML workflows to reduce regression risk across a 5-person team.",
    ],
    learnings: [
      "Fine-tuning pays off when domain accuracy requirements exceed what prompt engineering alone can guarantee.",
      "RAG architecture must be shaped around lookup patterns, not copied from generic chatbot templates.",
      "Cross-functional delivery speed improves when AI capabilities are explained in business terms, not model terms.",
      "Production inference needs scaling and observability designed in from the start — not bolted on after demo day.",
    ],
    impact: [
      "40% faster incident triage across 82,000+ cybersecurity scenarios.",
      "~95% operational accuracy in regulatory mapping and gap reasoning.",
      "25% faster delivery across a 5-engineer cross-functional team.",
      "1,000+ concurrent requests supported on auto-scaling SageMaker endpoints.",
      "Unified SOC analytics view across 6+ security tools.",
    ],
  },
  "SVNIT (NIT Surat)": {
    hire_summary:
      "Research and engineer deep-learning systems for EEG-based depression detection, with emphasis on accuracy gains and distributed training efficiency.",
    hire_scope: [
      "Design and evaluate CNN-LSTM hybrid architectures for EEG signal classification.",
      "Engineer distributed TensorFlow training pipelines on AWS infrastructure.",
      "Benchmark against state-of-the-art baselines and document reproducible experiments.",
    ],
    hire_ownership: [
      "Model architecture design and experimentation",
      "Training pipeline engineering and performance optimization",
      "Experiment tracking, evaluation, and research reporting",
    ],
    hire_context: [
      "EEG-based mental-health screening needed better accuracy than existing baselines.",
      "Training runs were too slow for rapid iteration without distributed optimization.",
    ],
    business_problems: [
      "Depression detection from EEG signals required higher accuracy than published baselines.",
      "Long training cycles (12+ hours) slowed research iteration and hyperparameter search.",
      "Model architectures needed to generalize across noisy physiological signal data.",
    ],
    projects: [
      {
        name: "EEG Depression Detection (CNN-LSTM)",
        business_problem:
          "Existing EEG-based depression detection models underperformed on the lab's evaluation benchmarks.",
        contribution:
          "Designed a CNN-LSTM hybrid architecture tailored to temporal EEG signal patterns and classification objectives.",
        technologies: "Python · TensorFlow · CNN-LSTM · EEG signal processing",
        outcome:
          "Achieved 90% accuracy — a 15% improvement over state-of-the-art baselines in the research setting.",
      },
      {
        name: "Distributed Training Pipeline (AWS EC2)",
        business_problem:
          "Single-node training took ~12 hours per experiment, limiting how many architectures could be tested.",
        contribution:
          "Engineered a distributed TensorFlow training pipeline on AWS EC2 with parallel processing and memory optimization.",
        technologies: "Python · TensorFlow · AWS EC2 · Distributed training",
        outcome:
          "Reduced training time from 12 hours to 7 hours per experiment cycle.",
      },
    ],
    automation: [
      "Distributed training job orchestration across AWS EC2 workers.",
      "Automated experiment batching and memory-optimized training configurations.",
    ],
    systems: [
      "CNN-LSTM hybrid model pipeline for EEG classification.",
      "Distributed TensorFlow training runtime on AWS EC2.",
      "Reproducible experiment and evaluation workflow for research benchmarks.",
    ],
    hardest_challenge: {
      challenge:
        "Improving EEG classification accuracy without overfitting to limited or noisy physiological recordings.",
      constraints: [
        "Noisy, high-dimensional EEG time-series data with limited labeled samples.",
        "Need to beat strong published baselines, not just in-sample accuracy.",
        "Long training times constrained how many architectures could be explored.",
      ],
      solution: [
        "Combined convolutional feature extraction with LSTM temporal modeling for signal dynamics.",
        "Built distributed training on AWS EC2 to run more experiments in parallel.",
        "Tuned memory usage and batching to cut wall-clock training time materially.",
      ],
      outcome: [
        "90% accuracy with a 15% improvement over state-of-the-art baselines.",
        "Training time reduced from 12 hours to 7 hours.",
      ],
    },
    tradeoffs: [
      "Chose CNN-LSTM hybrid over simpler MLP/CNN-only models — more complexity, better temporal modeling.",
      "Used distributed AWS EC2 training instead of local-only runs — infrastructure cost traded for iteration speed.",
      "Optimized training wall-clock time over marginal in-sample gains when experiments were compute-bound.",
    ],
    learnings: [
      "Architecture choice matters more than incremental tuning when signal structure is temporal and noisy.",
      "Research velocity depends on training infrastructure, not just model ideas.",
      "Benchmarking against published baselines keeps experiments honest.",
    ],
    impact: [
      "90% EEG depression-detection accuracy (15% above SOTA baselines).",
      "Training time reduced from 12 hours to 7 hours via distributed pipeline.",
    ],
  },
  "P P Savani University": {
    hire_summary:
      "Volunteer research internship building NLP systems for large-scale social-media depression detection and publishing peer-reviewed findings.",
    hire_scope: [
      "Build an end-to-end NLP pipeline for depression detection from social media text at scale.",
      "Engineer features, train ensemble models, and evaluate on 20,000+ posts.",
      "Prepare and publish peer-reviewed research for international conference presentation.",
    ],
    hire_ownership: [
      "Dataset processing, feature engineering, and model training",
      "Evaluation methodology and results analysis",
      "Paper writing and conference presentation preparation",
    ],
    hire_context: [
      "Mental-health signals in social text required robust NLP at scale.",
      "Research outcomes needed peer-reviewed validation, not just notebook results.",
    ],
    business_problems: [
      "Detecting depression signals in noisy social-media text across 20,000+ posts.",
      "Balancing model accuracy with interpretable features for research publication.",
      "Turning experimental NLP work into citable, peer-reviewed research output.",
    ],
    projects: [
      {
        name: "Social Media Depression Detection (NLP)",
        business_problem:
          "Large-scale social text datasets are noisy, imbalanced, and difficult to classify reliably for mental-health screening research.",
        contribution:
          "Built an end-to-end NLP depression detection system with ensemble methods and advanced feature engineering over 20,000+ posts.",
        technologies: "Python · NLP · Ensemble methods · Feature engineering",
        outcome:
          "Achieved 88.10% classification accuracy on the research dataset.",
      },
      {
        name: "ICICC 2024 Research Publication",
        business_problem:
          "Novel classification methodology needed external validation through peer review and conference presentation.",
        contribution:
          "Authored and published peer-reviewed research in ICICC 2024 (Springer LNNS) and presented at the international conference.",
        technologies: "Research writing · Experimental design · NLP evaluation",
        outcome:
          "Published and presented novel social-media depression detection methodology to the research community.",
      },
    ],
    automation: [
      "Batch preprocessing and feature-extraction pipelines for 20,000+ social-media posts.",
      "Reproducible training/evaluation scripts for ensemble model comparisons.",
    ],
    systems: [
      "End-to-end NLP classification pipeline for social-media depression detection.",
      "Ensemble modeling stack with feature-engineering and evaluation reporting.",
      "Research publication workflow producing ICICC 2024 (Springer LNNS) output.",
    ],
    hardest_challenge: {
      challenge:
        "Achieving strong classification accuracy on noisy, informal social-media text while keeping methodology publishable.",
      constraints: [
        "20,000+ posts with slang, code-switching, and class imbalance.",
        "Need for reproducible experiments suitable for peer review.",
        "Volunteer timeline with limited compute and mentoring bandwidth.",
      ],
      solution: [
        "Invested in feature engineering and ensemble methods rather than a single black-box model.",
        "Built rigorous train/eval splits and reporting for publication-ready claims.",
        "Iterated methodology until results supported a Springer LNNS conference paper.",
      ],
      outcome: [
        "88.10% accuracy on the target dataset.",
        "Peer-reviewed ICICC 2024 publication and international conference presentation.",
      ],
    },
    tradeoffs: [
      "Used ensemble methods over a single deep model — better stability and interpretability for publication.",
      "Prioritized reproducible feature engineering over chasing opaque benchmark scores.",
      "Focused research scope on social-text signals to produce a citable contribution within the internship window.",
    ],
    learnings: [
      "Noisy social text rewards careful feature engineering, not just bigger models.",
      "Research impact requires evaluation discipline and writing clarity, not only accuracy numbers.",
      "Early publication experience improves how I communicate technical work to broader audiences.",
    ],
    impact: [
      "88.10% accuracy on 20,000+ social-media posts.",
      "ICICC 2024 peer-reviewed publication (Springer LNNS).",
      "International conference presentation of novel classification methodology.",
    ],
  },
}
