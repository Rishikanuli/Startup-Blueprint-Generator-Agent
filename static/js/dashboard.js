/* === *
 * dashboard.js - Blueprint AI Dashboard
 * =======================================
 * Manages three states:
 *   1. AI Prompt Screen  - user types a free-text startup idea
 *   2. Loading Screen    - blueprint is being generated
 *   3. Blueprint View    - sections are displayed and navigable
 *
 * Data shape stored in sessionStorage['bpai_blueprint']:
 * {
 *   startup_name:    "FitPath AI",
 *   industry:        "HealthTech",
 *   target_audience: "...",
 *   prompt:          "original prompt text",
 *   sections: {
 *     summary:             { html: "...", raw: "..." },
 *     market_research:     { html: "...", raw: "..." },
 *     competitor_analysis: { html: "...", raw: "..." },
 *     user_personas:       { html: "...", raw: "..." },
 *     mvp_features:        { html: "...", raw: "..." },
 *     business_model:      { html: "...", raw: "..." },
 *     revenue_model:       { html: "...", raw: "..." },
 *     go_to_market:        { html: "...", raw: "..." },
 *     risk_analysis:       { html: "...", raw: "..." },
 *   }
 * }  */

(function () {
  'use strict';

  const STORAGE_KEY      = 'bpai_blueprint';
  const API_ENDPOINT     = '/api/generate-prompt';
  const API_ENDPOINT_SINGLE = '/api/generate';
  const HEALTH_ENDPOINT  = '/api/health';
  const STEP_INTERVAL_MS = 3500;

  /* === - Section metadata -  */
  const SECTIONS = [
    { key: 'summary',             label: 'Startup Summary',     icon: 'bi-lightbulb-fill'     },
    { key: 'market_research',     label: 'Market Research',     icon: 'bi-graph-up-arrow'     },
    { key: 'competitor_analysis', label: 'Competitor Analysis', icon: 'bi-trophy-fill'        },
    { key: 'user_personas',       label: 'User Personas',       icon: 'bi-people-fill'        },
    { key: 'mvp_features',        label: 'MVP Planner',         icon: 'bi-layers-fill'        },
    { key: 'business_model',      label: 'Business Model',      icon: 'bi-building-fill'      },
    { key: 'revenue_model',       label: 'Revenue Model',       icon: 'bi-currency-dollar'    },
    { key: 'go_to_market',        label: 'Go-to-Market',        icon: 'bi-geo-alt-fill'       },
    { key: 'risk_analysis',       label: 'Risk Analysis',       icon: 'bi-shield-exclamation' },
  ];

  /* === - Loading Screen Configurations -  */
  const LOADING_CONFIGS = {
    'default': {
      title: 'Crafting your blueprint...',
      subtitle: 'IBM Granite is analyzing your startup idea',
      prefix: 'Building blueprint for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Analyzing your idea' },
        { icon: 'bi-graph-up-arrow', text: 'Researching the market' },
        { icon: 'bi-people-fill', text: 'Building user personas' },
        { icon: 'bi-layers-fill', text: 'Planning MVP features' },
        { icon: 'bi-geo-alt-fill', text: 'Designing go-to-market' },
        { icon: 'bi-check-circle-fill', text: 'Finalizing your blueprint' }
      ]
    },
    'summary': {
      title: 'Generating Startup Summary...',
      subtitle: 'IBM Granite is summarizing your startup concept',
      prefix: 'Generating Startup Summary for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup concept' },
        { icon: 'bi-lightbulb-fill', text: 'Defining core value proposition' },
        { icon: 'bi-patch-question-fill', text: 'Structuring problem & solution' },
        { icon: 'bi-check-circle-fill', text: 'Finalizing summary report' }
      ]
    },
    'market_research': {
      title: 'Preparing Market Research...',
      subtitle: 'IBM Granite is conducting market analysis',
      prefix: 'Generating Market Research for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-graph-up-arrow', text: 'Researching market size' },
        { icon: 'bi-search', text: 'Identifying trends' },
        { icon: 'bi-calculator', text: 'Estimating TAM / SAM / SOM' },
        { icon: 'bi-file-earmark-bar-graph', text: 'Preparing market report' }
      ]
    },
    'competitor_analysis': {
      title: 'Analyzing Competitors...',
      subtitle: 'IBM Granite is evaluating the competitive landscape',
      prefix: 'Generating Competitor Analysis for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-search', text: 'Finding competitors' },
        { icon: 'bi-shield-check', text: 'Comparing strengths' },
        { icon: 'bi-lightning-fill', text: 'Identifying opportunities' },
        { icon: 'bi-file-earmark-spreadsheet', text: 'Preparing competitor report' }
      ]
    },
    'user_personas': {
      title: 'Creating User Personas...',
      subtitle: 'IBM Granite is modeling your target users',
      prefix: 'Generating User Personas for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-people-fill', text: 'Identifying target audience' },
        { icon: 'bi-person-badge-fill', text: 'Building customer personas' },
        { icon: 'bi-exclamation-octagon', text: 'Defining pain points & goals' },
        { icon: 'bi-check-circle-fill', text: 'Finalizing personas' }
      ]
    },
    'mvp_features': {
      title: 'Designing MVP Roadmap...',
      subtitle: 'IBM Granite is defining your product launch scope',
      prefix: 'Generating MVP Roadmap for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-layers-fill', text: 'Identifying core features' },
        { icon: 'bi-list-task', text: 'Prioritizing MVP' },
        { icon: 'bi-calendar-range', text: 'Planning development roadmap' },
        { icon: 'bi-file-earmark-check', text: 'Finalizing MVP plan' }
      ]
    },
    'business_model': {
      title: 'Building Business Model...',
      subtitle: 'IBM Granite is mapping your business fundamentals',
      prefix: 'Generating Business Model for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-gem', text: 'Creating value proposition' },
        { icon: 'bi-people-fill', text: 'Mapping customer segments' },
        { icon: 'bi-grid-3x3-gap-fill', text: 'Building Business Model Canvas' },
        { icon: 'bi-check-circle-fill', text: 'Finalizing business model' }
      ]
    },
    'revenue_model': {
      title: 'Designing Revenue Strategy...',
      subtitle: 'IBM Granite is modeling your monetization streams',
      prefix: 'Generating Revenue Strategy for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-cash-coin', text: 'Identifying revenue streams' },
        { icon: 'bi-tags-fill', text: 'Pricing strategy' },
        { icon: 'bi-percent', text: 'Unit economics' },
        { icon: 'bi-check-circle-fill', text: 'Finalizing revenue model' }
      ]
    },
    'go_to_market': {
      title: 'Planning Go-To-Market Strategy...',
      subtitle: 'IBM Granite is detailing your customer acquisition strategy',
      prefix: 'Generating Go-To-Market Strategy for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-person-check-fill', text: 'Defining target customers' },
        { icon: 'bi-megaphone-fill', text: 'Choosing marketing channels' },
        { icon: 'bi-graph-up', text: 'Customer acquisition strategy' },
        { icon: 'bi-file-earmark-check', text: 'Finalizing GTM plan' }
      ]
    },
    'risk_analysis': {
      title: 'Analyzing Business Risks...',
      subtitle: 'IBM Granite is identifying key business vulnerabilities',
      prefix: 'Generating Risk Analysis for: ',
      steps: [
        { icon: 'bi-cpu-fill', text: 'Understanding your startup' },
        { icon: 'bi-shield-exclamation', text: 'Identifying business risks' },
        { icon: 'bi-activity', text: 'Assessing impact' },
        { icon: 'bi-shield-shaded', text: 'Suggesting mitigation strategies' },
        { icon: 'bi-file-earmark-text-fill', text: 'Finalizing risk report' }
      ]
    }
  };

  /* === - State -  */
  var blueprint   = null;
  var activeIndex = 0;
  var stepTimer   = null;
  var currentStep = 0;
  var activeModuleKey = null;
  var activeSteps     = [];
  var retryCount      = 0;
  const MAX_RETRIES   = 2;

  /* === - DOM refs -  */
  var aiPromptScreen    = document.getElementById('aiPromptScreen');
  var dashLoadingScreen = document.getElementById('dashLoadingScreen');
  var blueprintView     = document.getElementById('blueprintView');

  // Prompt UI
  var aiPromptInput    = document.getElementById('aiPromptInput');
  var aiPromptCounter  = document.getElementById('aiPromptCounter');
  var aiPromptSendBtn  = document.getElementById('aiPromptSendBtn');
  var aiPromptError    = document.getElementById('aiPromptError');
  var aiPromptErrorMsg = document.getElementById('aiPromptErrorMsg');
  var aiPromptRetryBtn = document.getElementById('aiPromptRetryBtn');

  // Loading
  var dashLoadingLabel = document.getElementById('dashLoadingLabel');
  var genLoadingTitle  = document.getElementById('genLoadingTitle');
  var genLoadingSub    = document.getElementById('genLoadingSub');
  var genLoadingSteps  = document.getElementById('genLoadingSteps');

  // Blueprint view
  var startupHeaderName     = document.getElementById('startupHeaderName');
  var startupHeaderIndustry = document.getElementById('startupHeaderIndustry');
  var startupHeaderAudience = document.getElementById('startupHeaderAudience');
  var sidebarStartupInfo    = document.getElementById('sidebarStartupInfo');
  var sidebarStartupName    = document.getElementById('sidebarStartupName');
  var sidebarIndustry       = document.getElementById('sidebarIndustry');
  var panelIcon             = document.getElementById('panelIcon');
  var panelTitle            = document.getElementById('panelTitle');
  var reportContent         = document.getElementById('reportContent');
  var breadcrumbSection     = document.getElementById('breadcrumbSection');
  var activeModuleBadge     = document.getElementById('activeModuleBadge');
  var copySectionBtn        = document.getElementById('copySectionBtn');
  var copyAllBtn            = document.getElementById('copyAllBtn');
  var prevBtn               = document.getElementById('prevSectionBtn');
  var nextBtn               = document.getElementById('nextSectionBtn');
  var navLabel              = document.getElementById('sectionNavLabel');
  var modelVersion          = document.getElementById('modelVersion');
  var sectionNavArrows      = document.getElementById('sectionNavArrows');

  // Follow-up AI Assistant refs
  var followUpInput         = document.getElementById('followUpInput');
  var followUpSendBtn       = document.getElementById('followUpSendBtn');
  var followUpThread        = document.getElementById('followUpThread');

  // Sidebar & backdrop
  var sidebarToggle   = document.getElementById('sidebarToggle');
  var sidebarClose    = document.getElementById('sidebarClose');
  var sidebar         = document.getElementById('dashboardSidebar');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');

  /* === - Init -  */

  function init() {
    bindPromptUI();
    bindNewBlueprintButtons();
    bindSidebar();
    bindNavArrows();
    bindCopyButtons();
    bindSectionPills();
    bindSidebarItems();
    fetchModelVersion();
    bindFollowUpUI();
    bindPrintButton();

    // Parse URL parameter 'module'
    var urlParams = new URLSearchParams(window.location.search);
    var selectedModule = urlParams.get('module');

    if (selectedModule && SECTIONS.some(function(s) { return s.key === selectedModule; })) {
      // Clear any previous session blueprint to allow fresh generation
      sessionStorage.removeItem(STORAGE_KEY);
      blueprint = null;
      activeIndex = 0;
      activeModuleKey = selectedModule;
      
      showPromptScreen();
      prefillModulePrompt(selectedModule);
      return;
    }

    // Check if there's a previously generated blueprint in sessionStorage
    var raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.sections) {
          blueprint = parsed;
          if (!blueprint.followups) blueprint.followups = {};
          if (blueprint.selected_module) {
            activeModuleKey = blueprint.selected_module;
          }
          showBlueprintView();
          return;
        }
      } catch (_) { /* fall through to prompt screen */ }
    }

    // Default: show the AI prompt interface
    showPromptScreen();
  }

  function prefillModulePrompt(moduleKey) {
    var MODULE_PROMPTS_PREFILL = {
      'market_research': 'Generate a detailed Market Research report for my startup idea: ',
      'competitor_analysis': 'Generate a detailed Competitor Analysis for my startup idea: ',
      'user_personas': 'Generate detailed User Personas for my startup idea: ',
      'mvp_features': 'Generate an MVP roadmap for my startup idea: ',
      'business_model': 'Generate a Business Model Canvas for my startup idea: ',
      'revenue_model': 'Generate a Revenue Model for my startup idea: ',
      'go_to_market': 'Generate a Go-to-Market strategy for my startup idea: ',
      'risk_analysis': 'Generate a Risk Analysis for my startup idea: '
    };

    var prefill = MODULE_PROMPTS_PREFILL[moduleKey];
    if (prefill && aiPromptInput) {
      aiPromptInput.value = prefill;
      if (aiPromptCounter) {
        aiPromptCounter.textContent = prefill.length + ' / 2000';
      }
      aiPromptInput.focus();
      var len = prefill.length;
      aiPromptInput.setSelectionRange(len, len);
    }
  }

  function parseMetadataFromPrompt(promptText) {
    // Strip the prefill prefix first to get the actual idea
    var cleanedIdea = promptText;
    var MODULE_PROMPTS_PREFILL = {
      'market_research': 'Generate a detailed Market Research report for my startup idea: ',
      'competitor_analysis': 'Generate a detailed Competitor Analysis for my startup idea: ',
      'user_personas': 'Generate detailed User Personas for my startup idea: ',
      'mvp_features': 'Generate an MVP roadmap for my startup idea: ',
      'business_model': 'Generate a Business Model Canvas for my startup idea: ',
      'revenue_model': 'Generate a Revenue Model for my startup idea: ',
      'go_to_market': 'Generate a Go-to-Market strategy for my startup idea: ',
      'risk_analysis': 'Generate a Risk Analysis for my startup idea: '
    };

    var prefill = activeModuleKey ? MODULE_PROMPTS_PREFILL[activeModuleKey] : null;
    if (prefill && promptText.startsWith(prefill)) {
      cleanedIdea = promptText.substring(prefill.length).trim();
    }

    var firstSentence = cleanedIdea.split('.')[0].trim();
    var name = firstSentence.substring(0, 60).trim();
    if (firstSentence.length > 60) {
      var lastSpace = name.lastIndexOf(' ');
      if (lastSpace !== -1) {
        name = name.substring(0, lastSpace);
      }
    }
    if (!name) name = 'Startup Blueprint';

    // Simple industry guess
    var lower = cleanedIdea.toLowerCase();
    var industry = 'Technology';
    if (lower.indexOf('health') !== -1 || lower.indexOf('medical') !== -1 || lower.indexOf('doctor') !== -1 || lower.indexOf('patient') !== -1 || lower.indexOf('care') !== -1) {
      industry = 'HealthTech';
    } else if (lower.indexOf('finance') !== -1 || lower.indexOf('fintech') !== -1 || lower.indexOf('payment') !== -1 || lower.indexOf('bank') !== -1 || lower.indexOf('invest') !== -1) {
      industry = 'FinTech';
    } else if (lower.indexOf('educat') !== -1 || lower.indexOf('study') !== -1 || lower.indexOf('learn') !== -1 || lower.indexOf('student') !== -1 || lower.indexOf('school') !== -1) {
      industry = 'EdTech';
    } else if (lower.indexOf('grocery') !== -1 || lower.indexOf('food') !== -1 || lower.indexOf('delivery') !== -1 || lower.indexOf('meal') !== -1) {
      industry = 'FoodTech';
    } else if (lower.indexOf('ecommerce') !== -1 || lower.indexOf('shop') !== -1 || lower.indexOf('store') !== -1 || lower.indexOf('retail') !== -1) {
      industry = 'E-commerce';
    } else if (lower.indexOf('saas') !== -1 || lower.indexOf('software') !== -1 || lower.indexOf('platform') !== -1) {
      industry = 'SaaS / Software';
    } else if (lower.indexOf('ai') !== -1 || lower.indexOf('intelligence') !== -1 || lower.indexOf('learning') !== -1 || lower.indexOf('granite') !== -1) {
      industry = 'AI / Machine Learning';
    }

    return {
      startup_name: name,
      industry: industry,
      target_audience: 'Derived from prompt'
    };
  }

  /* === FOLLOW-UP AI ASSISTANT ================== */

  var followUpSuggestions = document.getElementById('followUpSuggestions');

  function bindFollowUpUI() {
    if (followUpSendBtn) {
      followUpSendBtn.addEventListener('click', submitFollowUp);
    }
    if (followUpInput) {
      followUpInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitFollowUp();
        }
      });
      followUpInput.addEventListener('input', updateSuggestionsVisibility);
    }

    // Bind click events on suggestion pills
    document.querySelectorAll('.follow-up-suggestion-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var prompt = pill.dataset.prompt;
        if (prompt && followUpInput) {
          followUpInput.value = prompt;
          updateSuggestionsVisibility();
          followUpInput.focus();
          submitFollowUp();
        }
      });
    });

    updateSuggestionsVisibility();
  }

  function updateSuggestionsVisibility() {
    if (!followUpSuggestions || !followUpInput) return;
    var isEmpty = followUpInput.value.trim() === '';
    followUpSuggestions.classList.toggle('d-none', !isEmpty);
  }

  async function submitFollowUp() {
    var prompt = followUpInput ? followUpInput.value.trim() : '';
    if (!prompt) return;

    if (!blueprint) return;
    var section = SECTIONS[activeIndex];
    if (!section) return;

    if (!blueprint.followups) blueprint.followups = {};
    if (!blueprint.followups[section.key]) blueprint.followups[section.key] = [];

    var history = blueprint.followups[section.key];
    var sectionContent = reportContent ? (reportContent.dataset.raw || reportContent.innerText || '') : '';

    // Clear any previous error alerts
    var oldErr = document.getElementById('followUpError');
    if (oldErr) oldErr.remove();

    // Render local user bubble + assistant loading state inside thread
    history.push({ role: 'user', content: prompt });
    renderFollowUpThread(section.key, true);

    setFollowUpLoading(true);
    followUpInput.value = '';
    updateSuggestionsVisibility();

    try {
      var response = await fetch('/api/chat-followup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          prompt:          prompt,
          section_key:     section.key,
          section_content: sectionContent,
          original_prompt: blueprint.prompt || '',
          history:         history.slice(0, -1), // send previous history (without the newly appended user message)
          full_context:    blueprint.sections
        })
      });

      if (!response.ok) {
        var errMsg = 'Server error: ' + response.statusText;
        try {
          var errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      var contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error("The server returned an invalid non-JSON response. Please try again.");
      }

      var data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get a response.');
      }

      var responseText = data.response || data.content || '';
      
      // Update local section content
      var compiledHtml = renderSectionHTML(section.key, responseText);
      blueprint.sections[section.key] = {
        raw: responseText,
        html: compiledHtml
      };

      // Add assistant response to history
      history.push({ role: 'assistant', content: responseText });
      blueprint.followups[section.key] = history;

      // Save updated blueprint to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));

      // Re-render conversation thread
      renderFollowUpThread(section.key, false);

      // Smooth direct section content transition
      if (reportContent) {
        reportContent.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        reportContent.style.opacity = '0';
        reportContent.style.transform = 'translateY(4px)';
        
        setTimeout(function () {
          reportContent.innerHTML = cleanAndPostProcessReport(compiledHtml);
          reportContent.dataset.raw = responseText;
          
          // Apply bootstrap table wrappers
          reportContent.querySelectorAll('table').forEach(function(table) {
            table.className = 'table table-striped table-bordered table-hover align-middle mb-0';
            if (!table.parentElement.classList.contains('table-responsive')) {
              var wrapper = document.createElement('div');
              wrapper.className = 'table-responsive rounded-3 overflow-hidden border mb-4';
              table.parentNode.insertBefore(wrapper, table);
              wrapper.appendChild(table);
            }
          });
          
          // Sync print/PDF view
          populatePrintView();
          
          reportContent.style.opacity = '1';
          reportContent.style.transform = 'translateY(0)';
        }, 200);
      }

    } catch (err) {
      console.error(err);
      
      // Remove the last user message from history on failure so they can retry
      if (history.length > 0) {
        history.pop();
      }
      renderFollowUpThread(section.key, false);

      var errDiv = document.createElement('div');
      errDiv.id = 'followUpError';
      errDiv.className = 'alert alert-danger mt-2 py-2 px-3 small';
      errDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>' + (err.message || 'Failed to update section. Please try again.');
      if (followUpInput && followUpInput.parentNode && followUpInput.parentNode.parentNode) {
        followUpInput.parentNode.parentNode.appendChild(errDiv);
      }
    } finally {
      setFollowUpLoading(false);
    }
  }


  function cleanAndPostProcessReport(htmlText) {
    if (!htmlText) return "";

    // 1. Remove introductory conversational text
    htmlText = htmlText.replace(/^(<p>)?(Here is the|Certainly|Below is the|This is the|I have generated the|Sure, here is the).+?:(<\/p>)?/gi, '');
    
    // 2. Remove concluding conversational text
    htmlText = htmlText.replace(/(<p>)?(Hope this is helpful|Let me know if you need|I hope this helps|If you need any adjustments).+?(<\/p>)?$/gi, '');

    // 3. Clean LaTeX math formatting
    htmlText = cleanLatexMath(htmlText);

    return htmlText;
  }

  function cleanLatexMath(htmlText) {
    // Replace block/display math $$...$$ or \[...\]
    htmlText = htmlText.replace(/\$\$(.*?)\$\$/g, function(match, math) {
      return '<div class="latex-math-block">' + cleanMathExpression(math) + '</div>';
    });
    htmlText = htmlText.replace(/\\\[(.*?)\\\]/g, function(match, math) {
      return '<div class="latex-math-block">' + cleanMathExpression(math) + '</div>';
    });
    
    // Replace inline math $...$ or \(...\)
    htmlText = htmlText.replace(/\$(.*?)\$/g, function(match, math) {
      return '<span class="latex-math-inline">' + cleanMathExpression(math) + '</span>';
    });
    htmlText = htmlText.replace(/\\\((.*?)\\\)/g, function(match, math) {
      return '<span class="latex-math-inline">' + cleanMathExpression(math) + '</span>';
    });
    
    return htmlText;
  }

  function cleanMathExpression(math) {
    return math
      .replace(/\\text\{(.*?)\}/g, '$1')
      .replace(/\\times/g, ' × ')
      .replace(/\\cdot/g, ' · ')
      .replace(/\\div/g, ' ÷ ')
      .replace(/\\approx/g, ' ≈ ')
      .replace(/\\le/g, ' ≤ ')
      .replace(/\\ge/g, ' ≥ ')
      .replace(/\\ne/g, ' ≠ ')
      .replace(/\\infty/g, '∞')
      .replace(/\\sum/g, '∑')
      .replace(/\\prod/g, '∏')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\pi/g, 'π')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\partial/g, '∂')
      .replace(/\\nabla/g, '∇')
      .replace(/\\{/g, '{')
      .replace(/\\}/g, '}')
      .replace(/\\_/g, '_')
      .replace(/\\^/g, '^')
      .trim();
  }

  function setFollowUpLoading(loading) {
    if (!followUpSendBtn || !followUpInput) return;
    followUpInput.disabled = loading;
    followUpSendBtn.disabled = loading;
    
    var def = followUpSendBtn.querySelector('.follow-up-send-default');
    var spin = followUpSendBtn.querySelector('.follow-up-send-loading');
    
    if (def) def.classList.toggle('d-none', loading);
    if (spin) spin.classList.toggle('d-none', !loading);
  }

  /* === SCREEN TRANSITIONS ====================== */

  function showPromptScreen() {
    aiPromptScreen.classList.remove('d-none');
    dashLoadingScreen.classList.add('d-none');
    blueprintView.classList.add('d-none');

    // Update topbar - hide section badge on prompt screen
    if (breadcrumbSection) {
      if (activeModuleKey) {
        var sec = SECTIONS.find(function (s) { return s.key === activeModuleKey; });
        breadcrumbSection.textContent = sec ? sec.label : 'Dashboard';
      } else {
        breadcrumbSection.textContent = 'Dashboard';
      }
    }
    if (activeModuleBadge) {
      activeModuleBadge.innerHTML = '';
      activeModuleBadge.classList.add('d-none');
    }

    // Set page title dynamically
    if (activeModuleKey) {
      var sec = SECTIONS.find(function (s) { return s.key === activeModuleKey; });
      document.title = (sec ? sec.label : 'Dashboard') + ' | BlueprintAI';
    } else {
      document.title = 'BlueprintAI | Dashboard';
    }

    // Set generate button text dynamically
    var sendBtnText = aiPromptSendBtn ? aiPromptSendBtn.querySelector('.ai-send-default') : null;
    if (sendBtnText) {
      if (activeModuleKey) {
        var sec = SECTIONS.find(function (s) { return s.key === activeModuleKey; });
        sendBtnText.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Generate ' + (sec ? sec.label : 'Blueprint');
      } else {
        sendBtnText.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Generate Full Blueprint';
      }
    }

    // Lock sidebar items
    lockSidebarItems();

    // Hide startup pill in sidebar
    if (sidebarStartupInfo) sidebarStartupInfo.classList.add('d-none');

    // Clear any previous error
    hidePromptError();
  }

  function showLoadingScreen(promptText) {
    aiPromptScreen.classList.add('d-none');
    dashLoadingScreen.classList.remove('d-none');
    blueprintView.classList.add('d-none');

    // Get active config
    var config = LOADING_CONFIGS[activeModuleKey || 'default'] || LOADING_CONFIGS['default'];

    // Set loading title and subtitle
    if (genLoadingTitle) genLoadingTitle.textContent = config.title;
    if (genLoadingSub) genLoadingSub.textContent = config.subtitle;

    // Dynamically build loading steps
    activeSteps = [];
    if (genLoadingSteps) {
      genLoadingSteps.innerHTML = '';
      config.steps.forEach(function (step, index) {
        var stepId = 'lstep' + (index + 1);
        activeSteps.push(stepId);
        
        var stepDiv = document.createElement('div');
        stepDiv.className = 'gen-step' + (index === 0 ? ' active' : '');
        stepDiv.id = stepId;
        stepDiv.innerHTML = '<i class="bi ' + step.icon + '"></i> ' + step.text;
        
        genLoadingSteps.appendChild(stepDiv);
      });
    }

    // Set label with stripped prefix if present
    var cleanedIdea = promptText;
    var MODULE_PROMPTS_PREFILL = {
      'market_research': 'Generate a detailed Market Research report for my startup idea: ',
      'competitor_analysis': 'Generate a detailed Competitor Analysis for my startup idea: ',
      'user_personas': 'Generate detailed User Personas for my startup idea: ',
      'mvp_features': 'Generate an MVP roadmap for my startup idea: ',
      'business_model': 'Generate a Business Model Canvas for my startup idea: ',
      'revenue_model': 'Generate a Revenue Model for my startup idea: ',
      'go_to_market': 'Generate a Go-to-Market strategy for my startup idea: ',
      'risk_analysis': 'Generate a Risk Analysis for my startup idea: '
    };

    var prefill = activeModuleKey ? MODULE_PROMPTS_PREFILL[activeModuleKey] : null;
    if (prefill && promptText.startsWith(prefill)) {
      cleanedIdea = promptText.substring(prefill.length).trim();
    }

    if (dashLoadingLabel) {
      var displayIdea = cleanedIdea.substring(0, 70) + (cleanedIdea.length > 70 ? '...' : '');
      dashLoadingLabel.textContent = config.prefix + '"' + displayIdea + '"';
    }

    // Reset and start steps
    currentStep = 0;
    if (stepTimer) clearInterval(stepTimer);
    stepTimer = setInterval(advanceStep, STEP_INTERVAL_MS);
  }

  function showBlueprintView() {
    aiPromptScreen.classList.add('d-none');
    dashLoadingScreen.classList.add('d-none');
    blueprintView.classList.remove('d-none');

    // Stop step timer
    stopStepTimer();

    // Populate header
    var name     = blueprint.startup_name    || 'Startup Blueprint';
    var industry = blueprint.industry        || '-';
    var audience = blueprint.target_audience || '-';

    if (startupHeaderName)     startupHeaderName.textContent      = name;
    if (startupHeaderIndustry) startupHeaderIndustry.textContent  = industry;
    if (startupHeaderAudience) startupHeaderAudience.textContent  = 'Audience: ' + audience;

    if (sidebarStartupName)    sidebarStartupName.textContent     = name;
    if (sidebarIndustry)       sidebarIndustry.textContent        = industry;
    if (sidebarStartupInfo)    sidebarStartupInfo.classList.remove('d-none');

    // Mark status dots green
    document.querySelectorAll('.section-status-dot').forEach(function (dot) {
      var key = dot.dataset.statusFor;
      if (key && blueprint.sections && blueprint.sections[key]) {
        dot.classList.add('dot-ready');
      }
    });

    // Unlock sidebar
    unlockSidebarItems();

    // Populate Print-only view for PDF Export
    populatePrintView();

    // Show/hide other section pills based on Single Module Mode
    document.querySelectorAll('.section-pill[data-section]').forEach(function (pill) {
      if (activeModuleKey) {
        var isTarget = pill.dataset.section === activeModuleKey;
        pill.classList.toggle('d-none', !isTarget);
      } else {
        pill.classList.remove('d-none');
      }
    });

    // Show/hide navigation arrows based on Single Module Mode
    if (sectionNavArrows) {
      if (activeModuleKey) {
        sectionNavArrows.classList.add('d-none');
      } else {
        sectionNavArrows.classList.remove('d-none');
      }
    }

    // Navigate to target section index
    var targetIndex = 0;
    if (activeModuleKey) {
      var idx = SECTIONS.findIndex(function (s) { return s.key === activeModuleKey; });
      if (idx !== -1) targetIndex = idx;
    }
    navigateTo(targetIndex);

    // Update topbar breadcrumb and document title
    var activeSection = SECTIONS[targetIndex];
    if (breadcrumbSection && activeSection) {
      breadcrumbSection.textContent = activeSection.label;
    }
    if (activeSection) {
      document.title = activeSection.label + ' | BlueprintAI';
    }
  }

  /* === PROMPT SUBMISSION ======================= */

  function bindPromptUI() {
    if (!aiPromptInput) return;

    // Character counter
    aiPromptInput.addEventListener('input', function () {
      var len = aiPromptInput.value.length;
      if (aiPromptCounter) aiPromptCounter.textContent = len + ' / 2000';
      hidePromptError();
    });

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to submit
    aiPromptInput.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitPrompt();
      }
    });

    // Send button
    if (aiPromptSendBtn) {
      aiPromptSendBtn.addEventListener('click', function () {
        submitPrompt();
      });
    }

    // Example pills
    document.querySelectorAll('.ai-example-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var prompt = pill.dataset.prompt || '';
        if (aiPromptInput) {
          aiPromptInput.value = prompt;
          if (aiPromptCounter) aiPromptCounter.textContent = prompt.length + ' / 2000';
          aiPromptInput.focus();
          hidePromptError();
        }
      });
    });

    // Retry button
    if (aiPromptRetryBtn) {
      aiPromptRetryBtn.addEventListener('click', function () {
        submitPrompt();
      });
    }
  }

  async function submitPrompt() {
    var prompt = aiPromptInput ? aiPromptInput.value.trim() : '';

    if (!prompt) {
      showPromptError('Please enter your startup idea before generating a blueprint.');
      if (aiPromptInput) aiPromptInput.focus();
      return;
    }
    if (prompt.length < 10) {
      showPromptError('Please provide a more detailed description (at least 10 characters).');
      if (aiPromptInput) aiPromptInput.focus();
      return;
    }

    hidePromptError();
    setSendLoading(true);
    showLoadingScreen(prompt);

    // Allow up to 3 minutes for all 9 sections to generate
    var controller = new AbortController();
    var timeoutId  = setTimeout(function () { controller.abort(); }, 3 * 60 * 1000);

    try {
      var endpoint = activeModuleKey ? API_ENDPOINT_SINGLE : API_ENDPOINT;
      var bodyPayload = activeModuleKey 
        ? { startup_idea: prompt, module: activeModuleKey }
        : { prompt: prompt };

      var response = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(bodyPayload),
        signal:  controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        var errMsg = 'Server error: ' + response.statusText;
        try {
          var errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      var contentType = response.headers.get("content-type") || "";
      var parsedData = null;

      if (contentType.indexOf("application/x-ndjson") !== -1) {
        // Stop the fake step timer since we now have real progress updates
        stopStepTimer();

        // Reset step states in the loading overlay to all inactive except first
        activeSteps.forEach(function (stepId, index) {
          var stepDiv = document.getElementById(stepId);
          if (stepDiv) {
            stepDiv.classList.remove('done', 'active');
            if (index === 0) {
              stepDiv.classList.add('active');
            }
          }
        });

        var completedSections = {};
        
        // Define loading step completion based on sections
        var updateRealProgress = function (sectionKey) {
          completedSections[sectionKey] = true;
          
          var stepStatus = [
            !!completedSections['summary'], // Step 1: summary (Analyzing your idea)
            !!completedSections['market_research'] && !!completedSections['competitor_analysis'], // Step 2: market & competitor
            !!completedSections['user_personas'], // Step 3: personas
            !!completedSections['mvp_features'], // Step 4: MVP
            !!completedSections['business_model'] && !!completedSections['revenue_model'] && !!completedSections['go_to_market'], // Step 5: GTM
            !!completedSections['risk_analysis'] // Step 6: risks (Finalizing)
          ];

          // Find the active step index sequentially (first incomplete step)
          var activeStepIndex = 0;
          for (var i = 0; i < stepStatus.length; i++) {
            if (!stepStatus[i]) {
              activeStepIndex = i;
              break;
            }
            if (i === stepStatus.length - 1) {
              activeStepIndex = stepStatus.length; // All steps completed
            }
          }

          // Update each step in the UI
          for (var i = 0; i < stepStatus.length; i++) {
            var stepId = activeSteps[i];
            var stepDiv = document.getElementById(stepId);
            if (stepDiv) {
              if (i < activeStepIndex) {
                stepDiv.classList.add('done');
                stepDiv.classList.remove('active');
              } else if (i === activeStepIndex) {
                stepDiv.classList.add('active');
                stepDiv.classList.remove('done');
              } else {
                stepDiv.classList.remove('active', 'done');
              }
            }
          }
        };

        var reader = response.body.getReader();
        var decoder = new TextDecoder("utf-8");
        var buffer = "";

        while (true) {
          var chunk = await reader.read();
          var value = chunk.value;
          var done = chunk.done;
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          var lines = buffer.split("\n");
          buffer = lines.pop(); // Keep the last incomplete line in buffer

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            var data;
            try {
              data = JSON.parse(line);
            } catch (e) {
              console.error("Failed to parse JSON line:", line, e);
              continue;
            }

            if (data.type === 'error') {
              throw new Error(data.error || 'An error occurred during generation.');
            }

            if (data.type === 'meta') {
              parsedData = {
                success: true,
                startup_name: data.startup_name,
                industry: data.industry,
                target_audience: data.target_audience,
                prompt: prompt,
                sections: {}
              };
            } else if (data.type === 'section') {
              if (parsedData) {
                parsedData.sections[data.key] = {
                  raw: data.raw,
                  html: renderSectionHTML(data.key, data.raw)
                };
              }
              // Update loading UI based on completed section
              if (!activeModuleKey) {
                updateRealProgress(data.key);
              } else {
                advanceStep();
              }
            }
          }
        }
      } else {
        // Backward compatibility for standard JSON responses
        if (contentType.indexOf("application/json") === -1) {
          throw new Error("The server returned an invalid response format. Please try again.");
        }

        var data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'An unexpected error occurred.');
        }

        if (activeModuleKey) {
          var metadata = parseMetadataFromPrompt(prompt);
          parsedData = {
            success: true,
            startup_name: metadata.startup_name,
            industry: metadata.industry,
            target_audience: metadata.target_audience,
            prompt: prompt,
            selected_module: activeModuleKey,
            sections: {}
          };
          parsedData.sections[activeModuleKey] = {
            raw: data.raw || data.content,
            html: renderSectionHTML(activeModuleKey, data.raw || data.content)
          };
        } else {
          parsedData = data;
          if (parsedData.sections) {
            for (var key in parsedData.sections) {
              if (parsedData.sections.hasOwnProperty(key)) {
                parsedData.sections[key].html = renderSectionHTML(key, parsedData.sections[key].raw);
              }
            }
          }
        }
      }

      if (!parsedData || Object.keys(parsedData.sections).length === 0) {
        throw new Error('No sections were generated successfully.');
      }

      // Store in sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      blueprint = parsedData;
      retryCount = 0; // Reset retry count on successful generation

      // Complete all remaining loading steps in UI
      activeSteps.forEach(function (stepId) {
        var stepDiv = document.getElementById(stepId);
        if (stepDiv) {
          stepDiv.classList.remove('active');
          stepDiv.classList.add('done');
        }
      });

      setSendLoading(false);
      showBlueprintView();

    } catch (err) {
      clearTimeout(timeoutId);

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        // Keep loading screen, but update status message
        if (genLoadingTitle) {
          genLoadingTitle.textContent = 'The response was incomplete. Regenerating...';
        }
        if (genLoadingSub) {
          genLoadingSub.textContent = 'Retrying generation (Attempt ' + retryCount + ' of ' + MAX_RETRIES + ')...';
        }
        
        // Restart step timer animation if stopped
        if (!stepTimer) {
          currentStep = 0;
          stepTimer = setInterval(advanceStep, STEP_INTERVAL_MS);
        }

        setTimeout(function() {
          submitPrompt();
        }, 1500);
        return;
      }

      // Reset count and show error
      retryCount = 0;
      stopStepTimer();
      setSendLoading(false);
      showPromptScreen();

      // Translate browser network errors into readable messages
      var msg = err.message || '';
      if (err.name === 'AbortError') {
        msg = 'The request timed out after 3 minutes. The server may be overloaded - please try again.';
      } else if (msg === 'Failed to fetch' || msg.indexOf('NetworkError') !== -1 || msg.indexOf('fetch') !== -1) {
        msg = 'Could not reach the server. Make sure the Flask app is running on http://localhost:5000 and refresh the page.';
      }
      showPromptError(msg || 'Failed to generate blueprint. Please try again.', true);
    }
  }

  function showPromptError(msg, showRetry) {
    if (aiPromptErrorMsg) aiPromptErrorMsg.textContent = msg;
    if (aiPromptRetryBtn) {
      if (showRetry) {
        aiPromptRetryBtn.classList.remove('d-none');
      } else {
        aiPromptRetryBtn.classList.add('d-none');
      }
    }
    if (aiPromptError) aiPromptError.classList.remove('d-none');
  }

  function hidePromptError() {
    if (aiPromptError) aiPromptError.classList.add('d-none');
  }

  function setSendLoading(loading) {
    if (!aiPromptSendBtn) return;
    var def = aiPromptSendBtn.querySelector('.ai-send-default');
    var spin = aiPromptSendBtn.querySelector('.ai-send-loading');
    aiPromptSendBtn.disabled = loading;
    if (def)  def.classList.toggle('d-none', loading);
    if (spin) spin.classList.toggle('d-none', !loading);
  }

  /* === LOADING STEPS =========================== */

  function advanceStep() {
    var cur = document.getElementById(activeSteps[currentStep]);
    if (cur) { cur.classList.remove('active'); cur.classList.add('done'); }
    currentStep++;
    if (currentStep < activeSteps.length) {
      var next = document.getElementById(activeSteps[currentStep]);
      if (next) next.classList.add('active');
    } else {
      clearInterval(stepTimer);
      stepTimer = null;
    }
  }

  function stopStepTimer() {
    if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
  }

  /* === NEW BLUEPRINT RESET ===================== */

  function bindNewBlueprintButtons() {
    var ids = ['sidebarNewBlueprintBtn', 'topbarNewBlueprintBtn', 'headerNewBlueprintBtn'];
    ids.forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', resetToPrompt);
    });
  }

  function resetToPrompt() {
    // Clear stored blueprint
    sessionStorage.removeItem(STORAGE_KEY);
    blueprint = null;
    activeIndex = 0;
    activeModuleKey = null;

    // Remove query params from address bar
    if (window.history.replaceState) {
      var url = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: url }, '', url);
    }

    // Clear prompt input
    if (aiPromptInput) aiPromptInput.value = '';
    if (aiPromptCounter) aiPromptCounter.textContent = '0 / 2000';

    // Reset status dots
    document.querySelectorAll('.section-status-dot').forEach(function (dot) {
      dot.classList.remove('dot-ready');
    });

    showPromptScreen();
  }

  /* === SIDEBAR LOCK / UNLOCK =================== */

  function lockSidebarItems() {
    document.querySelectorAll('.sidebar-item[data-section]').forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove('sidebar-item-locked');
      btn.classList.toggle('active', activeModuleKey ? btn.dataset.section === activeModuleKey : false);
    });
  }

  function unlockSidebarItems() {
    document.querySelectorAll('.sidebar-item[data-section]').forEach(function (btn) {
      if (activeModuleKey) {
        var isTarget = btn.dataset.section === activeModuleKey;
        btn.disabled = !isTarget;
        btn.classList.toggle('sidebar-item-locked', !isTarget);
      } else {
        btn.disabled = false;
        btn.classList.remove('sidebar-item-locked');
      }
    });
  }

  /* === SECTION NAVIGATION ====================== */

  function bindSidebarItems() {
    document.querySelectorAll('.sidebar-item[data-section]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var targetSection = btn.dataset.section;
        if (!blueprint) {
          // Prompt screen: switch active module
          activeModuleKey = targetSection;
          prefillModulePrompt(activeModuleKey);
          showPromptScreen();
          closeSidebar();
        } else {
          // Blueprint screen: navigate to section
          var idx = SECTIONS.findIndex(function (s) { return s.key === targetSection; });
          if (idx !== -1) { navigateTo(idx); closeSidebar(); }
        }
      });
    });
  }

  function bindSectionPills() {
    document.querySelectorAll('.section-pill[data-section]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var idx = SECTIONS.findIndex(function (s) { return s.key === pill.dataset.section; });
        if (idx !== -1) navigateTo(idx);
      });
    });
  }

  function navigateTo(index) {
    if (!blueprint || index < 0 || index >= SECTIONS.length) return;
    activeIndex = index;

    // Automatically scroll to the top of the dashboard content container on section navigation
    var scrollContainer = document.getElementById('dashboardContent');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    var reportPanel = document.getElementById('reportPanel');
    if (reportPanel) {
      reportPanel.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var section = SECTIONS[index];
    var data    = blueprint.sections && blueprint.sections[section.key];

    // Update panel header
    if (panelIcon)  panelIcon.innerHTML  = '<i class="bi ' + section.icon + '"></i>';
    if (panelTitle) panelTitle.textContent = section.label;

    // Update breadcrumb + topbar badge - show badge while navigating sections
    if (breadcrumbSection) breadcrumbSection.textContent = section.label;

    // Set page title dynamically
    document.title = section.label + ' | BlueprintAI';
    if (activeModuleBadge) {
      activeModuleBadge.innerHTML = '<i class="bi ' + section.icon + ' me-1"></i>' + section.label;
      activeModuleBadge.classList.remove('d-none');
      activeModuleBadge.classList.add('d-sm-inline-flex');
    }

    // Render content
    if (data) {
      var compiledHtml = data.html || renderSectionHTML(section.key, data.raw);
      reportContent.innerHTML = cleanAndPostProcessReport(compiledHtml);
      reportContent.dataset.raw = data.raw || '';
    } else {
      reportContent.innerHTML = '<p class="text-muted fst-italic">No content available for this section.</p>';
      reportContent.dataset.raw = '';
    }

    // Animate in
    reportContent.style.opacity = '0';
    reportContent.style.transform = 'translateY(8px)';
    requestAnimationFrame(function () {
      reportContent.style.transition = 'opacity .3s ease, transform .3s ease';
      reportContent.style.opacity = '1';
      reportContent.style.transform = 'translateY(0)';
    });

    // Scroll report panel into view on mobile
    if (window.innerWidth < 992) {
      var panel = document.getElementById('reportPanel');
      if (panel) setTimeout(function () { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item[data-section]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.section === section.key);
    });

    // Update section pills active state
    document.querySelectorAll('.section-pill[data-section]').forEach(function (pill) {
      pill.classList.toggle('active', pill.dataset.section === section.key);
    });

    // Reset follow-up assistant state
    if (followUpInput) followUpInput.value = '';
    var oldErr = document.getElementById('followUpError');
    if (oldErr) oldErr.remove();
    if (followUpThread) {
      renderFollowUpThread(section.key, false);
    }
    updateSuggestionsVisibility();


    // Update nav arrows
    updateNavArrows();
  }

  /* === - Nav arrows -  */

  function bindNavArrows() {
    if (prevBtn) prevBtn.addEventListener('click', function () { navigateTo(activeIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { navigateTo(activeIndex + 1); });
  }

  function updateNavArrows() {
    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === SECTIONS.length - 1;
    if (navLabel) navLabel.textContent = (activeIndex + 1) + ' / ' + SECTIONS.length;
  }

  /* === - Copy buttons -  */

  /* === - Copy buttons -  */

  function compileJSONToMarkdown(sectionKey, rawJSONContent) {
    if (!rawJSONContent) return "";
    try {
      var data = JSON.parse(rawJSONContent);
      var md = "";
      if (sectionKey === 'summary') {
        if (data.executive_summary) md += "> **Executive Summary:** " + data.executive_summary + "\n\n";
        if (data.problem_statement) md += "### Problem Statement\n" + data.problem_statement + "\n\n";
        if (data.solution) md += "### Proposed Solution\n" + data.solution + "\n\n";
        if (data.value_proposition) md += "### Value Proposition\n" + data.value_proposition + "\n\n";
        if (data.target_audience) {
          md += "### Target Audience\n";
          if (Array.isArray(data.target_audience)) {
            data.target_audience.forEach(function(item) {
              md += "* **" + item.segment + "**: " + item.description + "\n";
            });
            md += "\n";
          } else {
            md += data.target_audience + "\n\n";
          }
        }
        if (data.key_differentiators) {
          md += "### Key Differentiators\n";
          if (Array.isArray(data.key_differentiators)) {
            md += "* " + data.key_differentiators.join("\n* ") + "\n\n";
          } else {
            md += data.key_differentiators + "\n\n";
          }
        }
        if (data.vision_statement) md += "### Vision Statement\n" + data.vision_statement + "\n\n";
      } else if (sectionKey === 'market_research') {
        if (data.market_overview) md += "### Market Overview\n" + data.market_overview + "\n\n";
        md += "### Market Size (TAM / SAM / SOM)\n";
        md += "* **" + (data.tam_label || "TAM") + ":** " + (data.tam || "-") + " (" + (data.tam_description || "") + ")\n";
        md += "* **" + (data.sam_label || "SAM") + ":** " + (data.sam || "-") + " (" + (data.sam_description || "") + ")\n";
        md += "* **" + (data.som_label || "SOM") + ":** " + (data.som || "-") + " (" + (data.som_description || "") + ")\n\n";
        if (data.industry_trends) md += "### Industry Trends\n* " + data.industry_trends.join("\n* ") + "\n\n";
        if (data.customer_insights) md += "### Customer Insights\n* " + data.customer_insights.join("\n* ") + "\n\n";
        if (data.market_opportunities) md += "### Market Opportunities\n* " + data.market_opportunities.join("\n* ") + "\n\n";
        if (data.key_statistics) {
          md += "### Key Market Statistics\n";
          data.key_statistics.forEach(function(stat) {
            md += "* **" + stat.label + ":** " + stat.value + " - " + stat.description + "\n";
          });
          md += "\n";
        }
        if (data.market_segments) {
          md += "### Market Segments Breakdown\n";
          data.market_segments.forEach(function(s) { md += "* **" + s.name + ":** " + s.percentage + "%\n"; });
          md += "\n";
        }
        if (data.growth_potential) md += "### Growth Potential\n" + data.growth_potential + "\n\n";
      } else if (sectionKey === 'competitor_analysis') {
        if (data.competitors) {
          md += "### Key Competitors\n";
          data.competitors.forEach(function(c) {
            md += "* **" + c.name + "**\n";
            md += "  * Strengths: " + c.strengths + "\n";
            md += "  * Weaknesses: " + c.weaknesses + "\n";
            md += "  * Market Gap: " + c.market_gap + "\n";
          });
          md += "\n";
        }
        if (data.matrix) {
          md += "### Competitive Advantage Matrix\n";
          md += "| Feature / Parameter | Our Startup | Competitor A | Competitor B | Competitor C |\n";
          md += "| :- | :- | :- | :- | :- |\n";
          data.matrix.forEach(function(r) {
            md += "| " + r.parameter + " | " + r.us + " | " + (r.compA || "-") + " | " + (r.compB || "-") + " | " + (r.compC || "-") + " |\n";
          });
          md += "\n";
        }
        if (data.competitive_advantage) md += "### Competitive Advantage\n" + data.competitive_advantage + "\n\n";
      } else if (sectionKey === 'user_personas') {
        if (data.personas) {
          md += "### User Personas\n";
          data.personas.forEach(function(p) {
            md += "* **" + p.name + "** (Age: " + p.age + ", Occupation: " + p.occupation + ", Location: " + (p.location || "N/A") + ")\n";
            md += "  * Background: " + p.background + "\n";
            md += "  * Goals: " + p.goals + "\n";
            md += "  * Pain Points: " + p.pain_points + "\n";
            md += "  * Motivations: " + p.motivations + "\n";
            md += "  * Buying Behavior: " + p.buying_behavior + "\n";
            md += "  * Spending Behavior: " + (p.spending_behavior || "N/A") + "\n";
            md += "  * Preferred Channels: " + p.preferred_channels + "\n";
            md += "  * Startup Solution Fit: " + p.solution_fit + "\n";
          });
          md += "\n";
        }
      } else if (sectionKey === 'mvp_features') {
        if (data.mvp_overview) md += "### MVP Overview\n" + data.mvp_overview + "\n\n";
        
        var compileFeatures = function(title, list) {
          if (list && list.length) {
            md += "### " + title + "\n";
            list.forEach(function(f) {
              md += "* **" + f.name + "**: " + f.description + " (Effort: " + f.effort + " | Impact: " + f.impact + ")\n";
            });
            md += "\n";
          }
        };
        compileFeatures("Core Features (Must Have)", data.core_features);
        compileFeatures("Nice to Have Features", data.nice_to_have_features);
        compileFeatures("Future Enhancements", data.future_enhancements);

        if (data.moscow) {
          md += "### MoSCoW Prioritization\n";
          data.moscow.forEach(function(f) {
            md += "* **[" + f.category + "] " + f.name + ":** " + f.description + "\n";
          });
          md += "\n";
        }
        if (data.roadmap) {
          md += "### Development Roadmap\n";
          data.roadmap.forEach(function(r) {
            md += "* **" + r.phase + " - " + r.title + "**: " + r.description + "\n";
          });
          md += "\n";
        }
        if (data.success_metrics) {
          md += "### Success Metrics\n* " + data.success_metrics.join("\n* ") + "\n\n";
        }
      } else if (sectionKey === 'business_model') {
        if (data.overview) md += "### Business Model Overview\n" + data.overview + "\n\n";
        md += "### Business Model Canvas\n\n";
        
        var formatBlockMd = function(title, block) {
          if (block) {
            md += "#### " + title + "\n";
            md += block.description + "\n";
            if (block.bullets && block.bullets.length) {
              block.bullets.forEach(function(b) { md += "* " + b + "\n"; });
            }
            md += "\n";
          }
        };

        if (data.value_proposition) {
          md += "#### Value Proposition: " + data.value_proposition.title + "\n";
          md += data.value_proposition.description + "\n";
          data.value_proposition.bullets.forEach(function(b) { md += "* " + b + "\n"; });
          md += "\n";
        }
        formatBlockMd("Customer Segments", data.customer_segments);
        formatBlockMd("Customer Relationships", data.customer_relationships);
        formatBlockMd("Channels", data.channels);
        formatBlockMd("Revenue Streams", data.revenue_streams);
        formatBlockMd("Cost Structure", data.cost_structure);
        formatBlockMd("Key Resources", data.key_resources);
        formatBlockMd("Key Activities", data.key_activities);
        formatBlockMd("Key Partners", data.key_partners);
      } else if (sectionKey === 'revenue_model') {
        if (data.overview) md += "### Revenue Model Overview\n" + data.overview + "\n\n";
        
        if (data.streams) {
          md += "### Revenue Streams\n";
          data.streams.forEach(function(s) {
            md += "* **" + s.name + " (" + s.percentage + "%)**: " + s.description + "\n";
          });
          md += "\n";
        }
        if (data.pricing_strategy) md += "### Pricing Strategy\n" + data.pricing_strategy + "\n\n";
        
        if (data.pricing_plans) {
          md += "### Pricing Plans\n";
          data.pricing_plans.forEach(function(p) {
            md += "* **" + p.name + " (" + p.price + "):** " + p.target + " - " + p.features.join(", ") + "\n";
          });
          md += "\n";
        }
        if (data.forecast) {
          md += "### Revenue Forecast\n";
          data.forecast.forEach(function(f) { md += "* " + f.label + ": " + f.value + "\n"; });
          md += "\n";
        }
        if (data.cost_structure) md += "### Cost Structure\n" + data.cost_structure + "\n\n";
        if (data.break_even_analysis) md += "### Break-even Analysis\n" + data.break_even_analysis + "\n\n";
        if (data.unit_economics) md += "### Unit Economics\n" + data.unit_economics + "\n\n";
        
        if (data.key_metrics) {
          md += "### Key Financial Metrics\n";
          data.key_metrics.forEach(function(m) {
            md += "* **" + m.label + "**: " + m.value + " - " + m.description + "\n";
          });
          md += "\n";
        }
        if (data.profitability_outlook) md += "### Profitability Outlook\n" + data.profitability_outlook + "\n\n";
      } else if (sectionKey === 'go_to_market') {
        if (data.gtm_overview) md += "### GTM Overview\n" + data.gtm_overview + "\n\n";
        if (data.icp) {
          md += "### Ideal Customer Profile (ICP)\n";
          md += "* **Role:** " + (data.icp.role || "-") + "\n";
          md += "* **Company Size:** " + (data.icp.company_size || "-") + "\n";
          md += "* **Industry:** " + (data.icp.industry || "-") + "\n";
          md += "* **Geography:** " + (data.icp.geography || "-") + "\n";
          md += "* **Core Pain Point:** " + (data.icp.pain_point || "-") + "\n";
          md += "* **Budget:** " + (data.icp.budget || "-") + "\n";
          md += "* **Buying Trigger:** " + (data.icp.buying_trigger || "-") + "\n";
          md += "* **CAC:** " + (data.icp.cac || "-") + "\n\n";
        }
        if (data.positioning_statement) {
          var ps = data.positioning_statement;
          md += "### Positioning Statement\n";
          md += "For " + (ps.for_whom || "-") + " who need " + (ps.who_need || "-") + ", " + (ps.product_name || "-") + " is a " + (ps.is_a || "-") + ". Unlike " + (ps.unlike || "-") + ", our product " + (ps.our_product || "-") + ".\n\n";
        }
        if (data.marketing_channels && data.marketing_channels.length) {
          md += "### Marketing Channels\n";
          data.marketing_channels.forEach(function(c) {
            md += "* **" + c.name + "** [" + c.priority + "]: " + c.description + " Expected ROI: " + c.expected_roi + "\n";
          });
          md += "\n";
        }
        if (data.acquisition_strategy) {
          md += "### Customer Acquisition Strategy\n" + (data.acquisition_strategy.overview || "") + "\n";
          if (data.acquisition_strategy.tactics) {
            data.acquisition_strategy.tactics.forEach(function(t) { md += "* **" + t.title + ":** " + t.description + "\n"; });
          }
          md += "\n";
        }
        if (data.sales_strategy) {
          md += "### Sales Strategy\n" + (data.sales_strategy.overview || "") + "\n";
          if (data.sales_strategy.steps) {
            data.sales_strategy.steps.forEach(function(s, i) { md += (i+1) + ". **" + s.title + ":** " + s.description + "\n"; });
          }
          md += "\n";
        }
        if (data.timeline && data.timeline.length) {
          md += "### 30/60/90-Day Launch Roadmap\n";
          data.timeline.forEach(function(t) {
            md += "**" + t.phase + " - " + t.title + "**\n";
            if (t.milestones) t.milestones.forEach(function(m) { md += "  * " + m + "\n"; });
            if (t.key_metric) md += "  Target KPI: " + t.key_metric + "\n";
            md += "\n";
          });
        }
        if (data.budget && data.budget.length) {
          md += "### Budget Allocation\n";
          data.budget.forEach(function(b) { md += "* " + b.label + ": " + b.percentage + "% (" + (b.amount_estimate || "") + ")\n"; });
          md += "\n";
        }
        if (data.kpis && data.kpis.length) {
          md += "### Success KPIs\n";
          data.kpis.forEach(function(k) { md += "* **" + k.label + ":** " + k.value + " - " + k.description + "\n"; });
          md += "\n";
        }
      } else if (sectionKey === 'risk_analysis') {
        if (data.risks) {
          md += "### Risk Severity & Mitigations\n";
          data.risks.forEach(function(r) { md += "* **[" + r.severity + "] " + r.title + ":** Mitigation - " + r.mitigation + "\n"; });
          md += "\n";
        }
        if (data.matrix) {
          md += "### Risk Matrix\n";
          md += "| Risk Description | Impact | Probability | Mitigation Cost | Priority |\n";
          md += "| :- | :- | :- | :- | :- |\n";
          data.matrix.forEach(function(r) {
            md += "| " + r.description + " | " + r.impact + " | " + r.probability + " | " + r.cost + " | " + r.priority + " |\n";
          });
          md += "\n";
        }
        if (data.kpis) {
          md += "### KPI Risk Monitoring\n";
          md += "| Risk Area | Key Performance Indicator (KPI) | Safe Threshold | Trigger Point |\n";
          md += "| :- | :- | :- | :- |\n";
          data.kpis.forEach(function(k) {
            md += "| " + k.area + " | " + k.kpi + " | " + k.safe + " | " + k.trigger + " |\n";
          });
          md += "\n";
        }
        if (data.recommendations) md += "### Executive Recommendations\n* " + data.recommendations.join("\n* ") + "\n\n";
      }
      return md;
    } catch(e) {
      return rawJSONContent;
    }
  }

  function bindCopyButtons() {
    if (copySectionBtn) copySectionBtn.addEventListener('click', copySection);
    if (copyAllBtn)     copyAllBtn.addEventListener('click', copyAllBlueprint);
  }

  async function copySection() {
    var rawText = reportContent ? (reportContent.dataset.raw || '') : '';
    var section = SECTIONS[activeIndex];
    var text = compileJSONToMarkdown(section.key, rawText) || (reportContent ? reportContent.innerText : '') || '';
    if (!text.trim()) return;

    var btn = this;
    try {
      await navigator.clipboard.writeText(text);
      var original = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Copied!';
      btn.classList.add('btn-copy-success');
      setTimeout(function () {
        btn.innerHTML = original;
        btn.classList.remove('btn-copy-success');
      }, 2500);
    } catch (_) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  async function copyAllBlueprint() {
    if (!blueprint) return;
    var compile = "";
    compile += "# " + (blueprint.startup_name || 'Startup Blueprint') + "\n";
    compile += "Industry/Sector: " + (blueprint.industry || '-') + "\n";
    compile += "Target Audience: " + (blueprint.target_audience || '-') + "\n\n";
    
    SECTIONS.forEach(function (sec) {
      var data = blueprint.sections && blueprint.sections[sec.key];
      if (data) {
        compile += "## " + sec.label + "\n\n";
        compile += compileJSONToMarkdown(sec.key, data.raw) + "\n\n";
      }
    });

    var btn = this;
    try {
      await navigator.clipboard.writeText(compile);
      var original = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Copied Full Blueprint!';
      btn.classList.add('btn-copy-success');
      setTimeout(function () {
        btn.innerHTML = original;
        btn.classList.remove('btn-copy-success');
      }, 2500);
    } catch (_) {
      var ta = document.createElement('textarea');
      ta.value = compile;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  /* === - Mobile sidebar -  */

  function bindSidebar() {
    if (sidebarToggle)   sidebarToggle.addEventListener('click', openSidebar);
    if (sidebarClose)    sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  function openSidebar() {
    if (sidebar)         sidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar)         sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('d-none');
    document.body.style.overflow = '';
  }

  /* === - Frontend Component Renderers -  */

  function renderSectionHTML(sectionKey, rawJSONContent) {
    if (!rawJSONContent) return "";
    var data = null;
    try {
      data = JSON.parse(rawJSONContent.trim());
    } catch(e) {
      // Try regex matching in case of text wrap
      var jsonMatch = rawJSONContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch(err) {}
      }
    }
    if (!data) {
      // Fallback: render markdown directly if not valid JSON
      if (typeof marked !== 'undefined') {
        if (typeof marked.use === 'function') {
          marked.use({ gfm: true, breaks: true });
        } else if (typeof marked.setOptions === 'function') {
          marked.setOptions({ gfm: true, breaks: true });
        }
        return marked.parse(rawJSONContent);
      }
      return '<p class="report-para">' + rawJSONContent.replace(/\n/g, '<br>') + '</p>';
    }

    if (sectionKey === 'summary')             return renderSummaryHTML(data);
    if (sectionKey === 'market_research')     return renderMarketResearchHTML(data);
    if (sectionKey === 'competitor_analysis') return renderCompetitorAnalysisHTML(data);
    if (sectionKey === 'user_personas')       return renderUserPersonasHTML(data);
    if (sectionKey === 'mvp_features')        return renderMvpFeaturesHTML(data);
    if (sectionKey === 'business_model')      return renderBusinessModelHTML(data);
    if (sectionKey === 'revenue_model')       return renderRevenueModelHTML(data);
    if (sectionKey === 'go_to_market')        return renderGoToMarketHTML(data);
    if (sectionKey === 'risk_analysis')       return renderRiskAnalysisHTML(data);
    
    return "";
  }

  function renderSummaryHTML(data) {
    var html = '';
    if (data.executive_summary) {
      html += '<blockquote><strong>Executive Summary</strong><br>' + marked.parse(data.executive_summary) + '</blockquote>';
    }
    if (data.problem_statement) {
      html += '<h5 class="report-heading">Problem Statement</h5>';
      html += '<div class="report-para">' + marked.parse(data.problem_statement) + '</div>';
    }
    if (data.solution) {
      html += '<h5 class="report-heading">Proposed Solution</h5>';
      html += '<div class="report-para">' + marked.parse(data.solution) + '</div>';
    }
    if (data.value_proposition) {
      html += '<h5 class="report-heading">Value Proposition</h5>';
      html += '<div class="report-para">' + marked.parse(data.value_proposition) + '</div>';
    }
    if (data.target_audience) {
      html += '<h5 class="report-heading">Target Audience</h5>';
      if (Array.isArray(data.target_audience) && data.target_audience.length) {
        html += '<div class="competitor-grid mt-2 mb-3">';
        data.target_audience.forEach(function(item) {
          html += '  <div class="competitor-card" style="border-top: 3px solid var(--primary-color, #0f62fe);">';
          html += '    <h6 class="fw-bold mb-2 text-primary" style="font-size: 1rem;"><i class="bi bi-person-fill-check me-2"></i>' + item.segment + '</h6>';
          html += '    <p class="mb-0 text-secondary" style="font-size: 0.9rem;">' + item.description + '</p>';
          html += '  </div>';
        });
        html += '</div>';
      } else {
        html += '<div class="report-para">' + marked.parse(data.target_audience) + '</div>';
      }
    }
    var diffs = data.key_differentiators || data.key_benefits;
    if (diffs && diffs.length) {
      html += '<h5 class="report-heading">Key Differentiators</h5>';
      html += '<ul class="report-list">';
      diffs.forEach(function(d) { html += '<li>' + marked.parse(d) + '</li>'; });
      html += '</ul>';
    }
    var vision = data.vision_statement || data.success_metrics;
    if (vision) {
      html += '<h5 class="report-heading">Vision Statement</h5>';
      if (Array.isArray(vision)) {
        html += '<div class="report-para"><em>' + marked.parse(vision.join(' ')) + '</em></div>';
      } else {
        html += '<div class="report-para"><em>' + marked.parse(vision) + '</em></div>';
      }
    }
    return html;
  }

  function cleanKPIMetric(value) {
    if (!value) return '-';
    var val = value.trim();
    
    // Strip trailing punctuation
    val = val.replace(/[.,;:]+$/, '');
    
    var commaIdx = val.indexOf(',');
    if (commaIdx !== -1) val = val.substring(0, commaIdx).trim();
    
    var semiIdx = val.indexOf(';');
    if (semiIdx !== -1) val = val.substring(0, semiIdx).trim();

    var parenIdx = val.indexOf('(');
    if (parenIdx !== -1) val = val.substring(0, parenIdx).trim();

    var words = val.split(/\s+/);
    if (words.length > 3) {
      val = words.slice(0, 3).join(' ');
    }
    return val;
  }

  function renderMarketResearchHTML(data) {
    var html = '';
    
    // 1. Market Overview
    if (data.market_overview) {
      html += '<h5 class="report-heading">Market Overview</h5>';
      html += '<div class="report-para">' + marked.parse(data.market_overview) + '</div>';
    }

    // 2. TAM / SAM / SOM
    html += '<h5 class="report-heading">Market Size (TAM / SAM / SOM)</h5>';
    html += '<div class="kpi-grid">';
    html += '  <div class="kpi-card">';
    html += '    <div class="kpi-label">' + (data.tam_label || 'TAM') + '</div>';
    html += '    <div class="kpi-value">' + cleanKPIMetric(data.tam) + '</div>';
    html += '    <div class="kpi-desc">' + (data.tam_description || '') + '</div>';
    html += '  </div>';
    html += '  <div class="kpi-card">';
    html += '    <div class="kpi-label">' + (data.sam_label || 'SAM') + '</div>';
    html += '    <div class="kpi-value">' + cleanKPIMetric(data.sam) + '</div>';
    html += '    <div class="kpi-desc">' + (data.sam_description || '') + '</div>';
    html += '  </div>';
    html += '  <div class="kpi-card">';
    html += '    <div class="kpi-label">' + (data.som_label || 'SOM') + '</div>';
    html += '    <div class="kpi-value">' + cleanKPIMetric(data.som) + '</div>';
    html += '    <div class="kpi-desc">' + (data.som_description || '') + '</div>';
    html += '  </div>';
    html += '</div>';

    // 3. Industry Trends
    if (data.industry_trends && data.industry_trends.length) {
      html += '<h5 class="report-heading">Industry Trends</h5><ul class="report-list">';
      data.industry_trends.forEach(function(t) { html += '<li>' + marked.parse(t) + '</li>'; });
      html += '</ul>';
    }

    // 4. Customer Insights
    if (data.customer_insights && data.customer_insights.length) {
      html += '<h5 class="report-heading">Customer Insights</h5><ul class="report-list">';
      data.customer_insights.forEach(function(ci) { html += '<li>' + marked.parse(ci) + '</li>'; });
      html += '</ul>';
    }

    // 5. Market Opportunities
    if (data.market_opportunities && data.market_opportunities.length) {
      html += '<h5 class="report-heading">Market Opportunities</h5><ul class="report-list">';
      data.market_opportunities.forEach(function(o) { html += '<li>' + marked.parse(o) + '</li>'; });
      html += '</ul>';
    }

    // 6. Key Statistics
    html += '<h5 class="report-heading">Key Statistics & Segments</h5>';
    if (data.key_statistics && data.key_statistics.length) {
      html += '<div class="kpi-grid mb-4">';
      data.key_statistics.forEach(function(stat) {
        html += '  <div class="kpi-card" style="border-top: 3px solid var(--primary-color, #0f62fe);">';
        html += '    <div class="kpi-label">' + stat.label + '</div>';
        html += '    <div class="kpi-value" style="color: var(--primary-color, #0f62fe);">' + stat.value + '</div>';
        html += '    <div class="kpi-desc">' + stat.description + '</div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    if (data.market_segments && data.market_segments.length) {
      html += '<div class="chart-container">';
      html += '  <div class="chart-title">Market Segments Breakdown</div>';
      var colors = ['#0f62fe', '#24a148', '#f1c21b', '#8a3ffc'];
      data.market_segments.forEach(function(s, idx) {
        var color = colors[idx % colors.length];
        var pct = s.percentage || 0;
        html += '  <div class="chart-row">';
        html += '    <div class="chart-label">' + s.name + '</div>';
        html += '    <div class="chart-bar-wrapper"><div class="chart-bar" style="width: ' + pct + '%; background-color: ' + color + ';"></div></div>';
        html += '    <div class="chart-value">' + pct + '%</div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 7. Growth Potential
    if (data.growth_potential) {
      html += '<h5 class="report-heading">Growth Potential</h5>';
      html += '<div class="report-para">' + marked.parse(data.growth_potential) + '</div>';
    }

    return html;
  }

  function renderCompetitorAnalysisHTML(data) {
    var html = '';
    
    // 1. Landscape Overview
    if (data.landscape_overview) {
      html += '<h5 class="report-heading">Competitive Landscape Overview</h5>';
      html += '<div class="report-para">' + marked.parse(data.landscape_overview) + '</div>';
    }

    // 2. Top Competitors
    if (data.competitors && data.competitors.length) {
      html += '<h5 class="report-heading">Top Competitors</h5>';
      html += '<div class="competitor-grid">';
      data.competitors.forEach(function(c) {
        html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid var(--primary-color, #0f62fe); min-height: 250px;">';
        html += '    <div>';
        html += '      <div class="d-flex justify-content-between align-items-start mb-2">';
        html += '        <h6 class="fw-bold mb-0 text-primary" style="font-size: 1.1rem;">' + c.name + '</h6>';
        html += '        <span class="badge bg-secondary-subtle text-secondary border px-2 py-1" style="font-size: 0.75rem;">' + (c.category || 'Competitor') + '</span>';
        html += '      </div>';
        html += '      <p class="mb-2" style="font-size: 0.9rem;"><strong>Strengths:</strong> ' + c.strengths + '</p>';
        html += '      <p class="mb-2" style="font-size: 0.9rem;"><strong>Weaknesses:</strong> ' + c.weaknesses + '</p>';
        html += '      <p class="mb-2" style="font-size: 0.9rem;"><strong>Pricing:</strong> ' + (c.pricing || '-') + '</p>';
        html += '      <p class="mb-0" style="font-size: 0.9rem;"><strong>Target Audience:</strong> ' + (c.target_audience || '-') + '</p>';
        html += '    </div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 3. Competitor Comparison Matrix
    if (data.matrix && data.matrix.length) {
      var compNames = (data.competitors && data.competitors.length >= 3) 
        ? [data.competitors[0].name, data.competitors[1].name, data.competitors[2].name] 
        : ['Competitor A', 'Competitor B', 'Competitor C'];

      html += '<h5 class="report-heading">Competitor Comparison Matrix</h5>';
      html += '<div class="table-responsive rounded-3 overflow-hidden border mb-4">';
      html += '  <table class="table table-striped table-bordered table-hover align-middle mb-0">';
      html += '    <thead><tr><th>Feature / Parameter</th><th>Our Startup</th><th>' + compNames[0] + '</th><th>' + compNames[1] + '</th><th>' + compNames[2] + '</th></tr></thead>';
      html += '    <tbody>';
      data.matrix.forEach(function(r) {
        html += '      <tr>';
        html += '        <td><strong>' + r.parameter + '</strong></td>';
        html += '        <td class="table-primary text-primary fw-semibold">' + r.us + '</td>';
        html += '        <td>' + (r.compA || r.competitorA || '-') + '</td>';
        html += '        <td>' + (r.compB || r.competitorB || '-') + '</td>';
        html += '        <td>' + (r.compC || r.competitorC || '-') + '</td>';
        html += '      </tr>';
      });
      html += '    </tbody>';
      html += '  </table>';
      html += '</div>';
    }

    // 4. Strengths & Weaknesses
    if (data.strengths_weaknesses_summary) {
      html += '<h5 class="report-heading">Strengths & Weaknesses</h5>';
      html += '<div class="report-para">' + marked.parse(data.strengths_weaknesses_summary) + '</div>';
    }

    // 5. Market Gap Analysis
    if (data.market_gap_analysis) {
      html += '<h5 class="report-heading">Market Gap Analysis</h5>';
      html += '<div class="report-para">' + marked.parse(data.market_gap_analysis) + '</div>';
    }

    // 6. Market Positioning Matrix
    html += '<h5 class="report-heading">Market Positioning Matrix</h5>';
    html += '<div class="row g-3 mb-4">';
    
    var quadrants = [
      { key: 'Leaders', label: 'Leaders (High Value / Advanced Tech)', class: 'border-primary', bg: 'rgba(15, 98, 254, 0.05)', list: ['Our Startup'] },
      { key: 'Challengers', label: 'Challengers (High Value / Legacy Tech)', class: 'border-success', bg: 'rgba(36, 161, 72, 0.05)', list: [] },
      { key: 'Niche', label: 'Niche (Specialized / High Price)', class: 'border-warning', bg: 'rgba(241, 194, 27, 0.05)', list: [] },
      { key: 'Cost-focused', label: 'Cost-focused (Basic / Low Price)', class: 'border-secondary', bg: 'rgba(110, 110, 110, 0.05)', list: [] }
    ];

    if (data.competitors) {
      data.competitors.forEach(function(c) {
        var quad = (c.quadrant || '').trim().toLowerCase();
        quadrants.forEach(function(q) {
          if (q.key.toLowerCase() === quad || (quad === 'challenger' && q.key === 'Challengers')) {
            q.list.push(c.name);
          }
        });
      });
    }

    quadrants.forEach(function(q) {
      html += '  <div class="col-md-6">';
      html += '    <div class="p-3 border rounded-3 h-100 ' + q.class + '" style="background-color: ' + q.bg + '; min-height: 100px;">';
      html += '      <div class="fw-bold mb-2 text-dark" style="font-size: 0.95rem;">' + q.label + '</div>';
      if (q.list.length > 0) {
        q.list.forEach(function(item) {
          var isUs = (item === 'Our Startup');
          html += '      <div class="badge ' + (isUs ? 'bg-primary' : 'bg-secondary') + ' me-1 mb-1 p-2" style="font-size: 0.85rem;"><i class="bi ' + (isUs ? 'bi-rocket-takeoff-fill' : 'bi-building-fill') + ' me-1"></i>' + item + '</div>';
        });
      } else {
        html += '      <span class="text-muted small">None identified</span>';
      }
      html += '    </div>';
      html += '  </div>';
    });
    html += '</div>';

    // 7. Competitive Advantage
    if (data.competitive_advantage) {
      html += '<h5 class="report-heading">Competitive Advantage</h5>';
      html += '<div class="report-para">' + marked.parse(data.competitive_advantage) + '</div>';
    }

    // 8. Strategic Recommendations
    if (data.strategic_recommendations && data.strategic_recommendations.length) {
      html += '<h5 class="report-heading">Strategic Recommendations</h5><ul class="report-list">';
      data.strategic_recommendations.forEach(function(r) { html += '<li>' + marked.parse(r) + '</li>'; });
      html += '</ul>';
    }

    return html;
  }

  function renderUserPersonasHTML(data) {
    var html = '';
    if (data.personas && data.personas.length) {
      html += '<div class="competitor-grid">';
      data.personas.forEach(function(p) {
        html += '<div class="competitor-card d-flex flex-column justify-content-between h-100" style="border-top: 3px solid var(--primary-color, #0f62fe); min-height: 480px; padding: 24px;">';
        html += '  <div>';
        html += '    <div class="d-flex align-items-center gap-3 mb-3">';
        html += '      <div class="persona-avatar" style="flex-shrink: 0; width: 50px; height: 50px; border-radius: 50%; background-color: var(--primary-color, #0f62fe); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">' + (p.avatar_initials || 'UP') + '</div>';
        html += '      <div>';
        html += '        <h5 class="fw-bold mb-0 text-dark" style="font-size: 1.15rem;">' + p.name + '</h5>';
        html += '        <span class="text-muted small">' + (p.age || '-') + ' yrs · ' + (p.occupation || '-') + ' · ' + (p.location || '-') + '</span>';
        html += '      </div>';
        html += '    </div>';
        if (p.background) {
          html += '    <p class="text-secondary mb-3" style="font-size: 0.88rem; line-height: 1.5; font-style: italic;">"' + p.background + '"</p>';
        }
        html += '    <div class="mb-3" style="font-size: 0.85rem;">';
        html += '      <div class="mb-1"><strong>Motivations:</strong> ' + (p.motivations || '-') + '</div>';
        html += '      <div class="mb-1"><strong>Buying & Budget:</strong> ' + (p.buying_behavior || '-') + ' (' + (p.spending_behavior || '-') + ')</div>';
        if (p.preferred_channels) {
          html += '      <div><strong>Preferred Channels:</strong> ' + p.preferred_channels + '</div>';
        }
        html += '    </div>';
        html += '    <div class="mb-2">';
        html += '      <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mb-1 me-1" style="font-size: 0.75rem;"><i class="bi bi-bullseye me-1"></i>Goals</span>';
        html += '      <p class="text-success-emphasis mb-2 ps-2 border-start border-success" style="font-size: 0.85rem; line-height: 1.4;">' + p.goals + '</p>';
        html += '    </div>';
        html += '    <div class="mb-3">';
        html += '      <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 mb-1 me-1" style="font-size: 0.75rem;"><i class="bi bi-exclamation-octagon me-1"></i>Pain Points</span>';
        html += '      <p class="text-danger-emphasis mb-3 ps-2 border-start border-danger" style="font-size: 0.85rem; line-height: 1.4;">' + p.pain_points + '</p>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="p-3 rounded border border-primary-subtle" style="background-color: rgba(15, 98, 254, 0.05);">';
        html += '    <div class="fw-bold text-primary mb-1" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;"><i class="bi bi-rocket-takeoff-fill me-1"></i>Startup Solution</div>';
        html += '    <div class="text-dark" style="font-size: 0.85rem; line-height: 1.4;">' + p.solution_fit + '</div>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
    }
    return html;
  }

  function renderMvpFeaturesHTML(data) {
    var html = '';
    
    // 1. MVP Overview
    if (data.mvp_overview) {
      html += '<h5 class="report-heading">MVP Overview</h5>';
      html += '<div class="report-para">' + marked.parse(data.mvp_overview) + '</div>';
    }

    // Feature Card Renderer Helper
    var renderFeatureList = function(title, list, accentColor) {
      if (list && list.length) {
        html += '<h5 class="report-heading">' + title + '</h5>';
        html += '<div class="competitor-grid">';
        list.forEach(function(f) {
          html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid ' + accentColor + '; padding: 20px; min-height: 180px;">';
          html += '    <div>';
          html += '      <div class="d-flex justify-content-between align-items-start mb-2">';
          html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">' + f.name + '</h6>';
          html += '        <span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 0.75rem;">Effort: ' + f.effort + '</span>';
          html += '      </div>';
          html += '      <p class="text-secondary mb-2" style="font-size: 0.88rem; line-height: 1.4;">' + f.description + '</p>';
          html += '    </div>';
          html += '    <div class="text-primary small mt-2"><i class="bi bi-graph-up-arrow me-1"></i><strong>Impact:</strong> ' + f.impact + '</div>';
          html += '  </div>';
        });
        html += '</div>';
      }
    };

    // 2. Core Features (Must Have)
    renderFeatureList("Core Features (Must Have)", data.core_features, "var(--primary-color, #0f62fe)");

    // 3. Nice to Have Features
    renderFeatureList("Nice to Have Features", data.nice_to_have_features, "var(--bs-success, #24a148)");

    // 4. Future Enhancements
    renderFeatureList("Future Enhancements", data.future_enhancements, "var(--bs-purple, #8a3ffc)");

    // 5. MoSCoW Prioritization
    if (data.moscow && data.moscow.length) {
      html += '<h5 class="report-heading">MoSCoW Prioritization</h5>';
      html += '<div class="feature-grid">';
      data.moscow.forEach(function(f) {
        var badgeClass = 'badge-must';
        var cat = (f.category || 'Must-Have').toLowerCase();
        if (cat.indexOf('should') !== -1) badgeClass = 'badge-should';
        if (cat.indexOf('could') !== -1) badgeClass = 'badge-could';
        if (cat.indexOf('wont') !== -1 || cat.indexOf('won\'t') !== -1) badgeClass = 'badge-high';
        
        html += '  <div class="feature-card">';
        html += '    <span class="feature-badge ' + badgeClass + '">' + (f.category || 'Must-Have') + '</span>';
        html += '    <h5 class="feature-title">' + f.name + '</h5>';
        html += '    <p>' + f.description + '</p>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 6. Development Roadmap (Visual Timeline)
    if (data.roadmap && data.roadmap.length) {
      html += '<h5 class="report-heading">Development Roadmap</h5>';
      html += '<div class="gtm-timeline">';
      data.roadmap.forEach(function(r, idx) {
        // Strip Phase prefix from timeline-badge to make it a compact badge icon/number
        var badgeLabel = (idx + 1).toString();
        html += '  <div class="timeline-item">';
        html += '    <div class="timeline-badge" style="font-size: 0.8rem; width: 32px; height: 32px; left: -41px; top: -1px;">' + badgeLabel + '</div>';
        html += '    <div class="timeline-content">';
        html += '      <h5 class="fw-bold text-dark mb-2">' + r.phase + ' - ' + r.title + '</h5>';
        html += '      <p class="text-secondary mb-0" style="font-size: 0.92rem; line-height: 1.45;">' + r.description + '</p>';
        html += '    </div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 7. Success Metrics
    if (data.success_metrics && data.success_metrics.length) {
      html += '<h5 class="report-heading">Success Metrics</h5><ul class="report-list">';
      data.success_metrics.forEach(function(m) { html += '<li>' + marked.parse(m) + '</li>'; });
      html += '</ul>';
    }

    return html;
  }

  function renderBusinessModelHTML(data) {
    var html = '';
    
    // 1. Business Model Overview
    if (data.overview) {
      html += '<h5 class="report-heading">Business Model Overview</h5>';
      html += '<div class="report-para">' + marked.parse(data.overview) + '</div>';
    }

    // Canvas layout starts
    html += '<h5 class="report-heading">Business Model Canvas</h5>';
    
    // Helper to format bullets as list items
    var formatBullets = function(bullets) {
      if (!bullets || !bullets.length) return '';
      var list = '<ul class="report-list" style="margin-top: 10px; margin-bottom: 0; padding-left: 20px;">';
      bullets.forEach(function(b) {
        list += '<li style="font-size: 0.88rem; line-height: 1.45;">' + b + '</li>';
      });
      list += '</ul>';
      return list;
    };

    // Helper to format badges for specific blocks
    var formatBadges = function(bullets, badgeClass) {
      if (!bullets || !bullets.length) return '';
      var container = '<div class="d-flex flex-wrap gap-1 mt-3">';
      bullets.forEach(function(b) {
        container += '<span class="badge ' + badgeClass + ' border px-2 py-1" style="font-size: 0.75rem;">' + b + '</span>';
      });
      container += '</div>';
      return container;
    };

    // Value Proposition (Premium Feature Card)
    if (data.value_proposition) {
      var vp = data.value_proposition;
      html += '<div class="card mb-4" style="border-top: 4px solid var(--primary-color, #0f62fe); background-color: rgba(15, 98, 254, 0.02); padding: 24px;">';
      html += '  <div class="d-flex align-items-center gap-2 mb-2">';
      html += '    <i class="bi bi-gift-fill text-primary" style="font-size: 1.4rem;"></i>';
      html += '    <h5 class="fw-bold mb-0 text-dark" style="font-size: 1.15rem;">Value Proposition: ' + vp.title + '</h5>';
      html += '  </div>';
      html += '  <p class="text-secondary mb-3" style="font-size: 0.9rem; line-height: 1.5;">' + vp.description + '</p>';
      html += formatBullets(vp.bullets);
      html += '</div>';
    }

    // Grid for other sections
    html += '<div class="competitor-grid">';

    // Customer Segments (With Badges)
    if (data.customer_segments) {
      var cs = data.customer_segments;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #8a3ffc; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-people-fill text-purple" style="color: #8a3ffc; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Customer Segments</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + cs.description + '</p>';
      html += '    </div>';
      html += formatBadges(cs.bullets, "bg-light text-secondary border-secondary-subtle");
      html += '  </div>';
    }

    // Customer Relationships
    if (data.customer_relationships) {
      var cr = data.customer_relationships;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #24a148; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-heart-fill text-success" style="color: #24a148; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Customer Relationships</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + cr.description + '</p>';
      html += '    </div>';
      html += formatBullets(cr.bullets);
      html += '  </div>';
    }

    // Channels (With Badges)
    if (data.channels) {
      var ch = data.channels;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #f1c21b; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-megaphone-fill text-warning" style="color: #f1c21b; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Channels</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + ch.description + '</p>';
      html += '    </div>';
      html += formatBadges(ch.bullets, "bg-warning-subtle text-warning-emphasis border-warning-subtle");
      html += '  </div>';
    }

    // Revenue Streams (With Badges)
    if (data.revenue_streams) {
      var rs = data.revenue_streams;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #054ada; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-cash-coin text-primary" style="color: #054ada; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Revenue Streams</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + rs.description + '</p>';
      html += '    </div>';
      html += formatBadges(rs.bullets, "bg-primary-subtle text-primary-emphasis border-primary-subtle");
      html += '  </div>';
    }

    // Cost Structure
    if (data.cost_structure) {
      var cost = data.cost_structure;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #da1e28; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-wallet2 text-danger" style="color: #da1e28; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Cost Structure</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + cost.description + '</p>';
      html += '    </div>';
      html += formatBullets(cost.bullets);
      html += '  </div>';
    }

    // Key Resources
    if (data.key_resources) {
      var kr = data.key_resources;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #002d9c; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-hdd-network text-primary" style="color: #002d9c; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Key Resources</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + kr.description + '</p>';
      html += '    </div>';
      html += formatBullets(kr.bullets);
      html += '  </div>';
    }

    // Key Activities
    if (data.key_activities) {
      var ka = data.key_activities;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #009d9a; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-calendar-check text-info" style="color: #009d9a; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Key Activities</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + ka.description + '</p>';
      html += '    </div>';
      html += formatBullets(ka.bullets);
      html += '  </div>';
    }

    // Key Partners
    if (data.key_partners) {
      var kp = data.key_partners;
      html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid #005d5d; padding: 20px; min-height: 220px;">';
      html += '    <div>';
      html += '      <div class="d-flex align-items-center gap-2 mb-2">';
      html += '        <i class="bi bi-handshake-fill text-dark" style="color: #005d5d; font-size: 1.2rem;"></i>';
      html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">Key Partners</h6>';
      html += '      </div>';
      html += '      <p class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.4;">' + kp.description + '</p>';
      html += '    </div>';
      html += formatBullets(kp.bullets);
      html += '  </div>';
    }

    html += '</div>'; // End Grid
    return html;
  }

  function renderRevenueModelHTML(data) {
    var html = '';

    // 1. Revenue Model Overview
    if (data.overview) {
      html += '<h5 class="report-heading">Revenue Model Overview</h5>';
      html += '<div class="report-para">' + marked.parse(data.overview) + '</div>';
    }

    // 2. Revenue Streams (Modern cards with progress bar/percentage comparisons)
    if (data.streams && data.streams.length) {
      html += '<h5 class="report-heading">Revenue Streams Breakdown</h5>';
      html += '<div class="competitor-grid mb-4">';
      data.streams.forEach(function(s, idx) {
        var pct = s.percentage || 0;
        var colors = ['#0f62fe', '#24a148', '#8a3ffc'];
        var color = colors[idx % colors.length];
        
        html += '  <div class="competitor-card d-flex flex-column justify-content-between" style="border-top: 3px solid ' + color + '; padding: 20px; min-height: 180px;">';
        html += '    <div>';
        html += '      <div class="d-flex justify-content-between align-items-center mb-2">';
        html += '        <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">' + s.name + '</h6>';
        html += '        <span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 0.75rem;">' + pct + '%</span>';
        html += '      </div>';
        html += '      <p class="text-secondary small mb-3" style="line-height: 1.45;">' + s.description + '</p>';
        html += '    </div>';
        html += '    <div class="chart-bar-wrapper" style="height: 6px; background-color: #e0e0e0; border-radius: 3px; overflow: hidden;">';
        html += '      <div class="chart-bar" style="width: ' + pct + '%; height: 100%; background-color: ' + color + ';"></div>';
        html += '    </div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 3. Pricing Strategy
    if (data.pricing_strategy) {
      html += '<h5 class="report-heading">Pricing Strategy</h5>';
      html += '<div class="report-para">' + marked.parse(data.pricing_strategy) + '</div>';
    }

    // 4. Pricing Plans (Pricing Cards Layout)
    if (data.pricing_plans && data.pricing_plans.length) {
      html += '<h5 class="report-heading">Pricing Plans</h5>';
      html += '<div class="competitor-grid mb-4">';
      data.pricing_plans.forEach(function(p, idx) {
        var isRecommended = (p.name.toLowerCase().indexOf('recommended') !== -1 || idx === 1);
        var borderStyle = isRecommended ? 'border: 2px solid var(--primary-color, #0f62fe);' : 'border: 1px solid #e0e0e0;';
        var headerBg = isRecommended ? 'background-color: rgba(15, 98, 254, 0.05);' : 'background-color: #f8f9fa;';
        
        html += '  <div class="card h-100 d-flex flex-column justify-content-between" style="' + borderStyle + ' border-radius: 8px; overflow: hidden; min-height: 350px;">';
        html += '    <div class="p-3" style="' + headerBg + ' border-bottom: 1px solid #e0e0e0; text-align: center;">';
        if (isRecommended) {
          html += '      <span class="badge bg-primary text-white mb-2" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Recommended</span>';
        }
        html += '      <h5 class="fw-bold mb-1 text-dark" style="font-size: 1.1rem;">' + p.name + '</h5>';
        html += '      <div class="text-primary fw-bold" style="font-size: 1.5rem; margin: 8px 0;">' + p.price + '</div>';
        html += '      <div class="text-muted small">' + p.target + '</div>';
        html += '    </div>';
        html += '    <div class="p-3 flex-grow-1">';
        if (p.features && p.features.length) {
          html += '      <ul style="list-style: none; padding-left: 0; margin-bottom: 0; font-size: 0.82rem; line-height: 1.6;">';
          p.features.forEach(function(f) {
            html += '        <li style="margin-bottom: 6px; color: #4d5358;"><i class="bi bi-check-circle-fill text-success me-2"></i>' + f + '</li>';
          });
          html += '      </ul>';
        }
        html += '    </div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 5. Revenue Forecast (Bar Chart)
    if (data.forecast && data.forecast.length) {
      html += '<h5 class="report-heading">3-Year Revenue Forecast</h5>';
      html += '<div class="chart-container mb-4">';
      data.forecast.forEach(function(f) {
        var pct = f.percentage || 0;
        html += '  <div class="chart-row">';
        html += '    <div class="chart-label">' + f.label + '</div>';
        html += '    <div class="chart-bar-wrapper"><div class="chart-bar" style="width: ' + pct + '%; background-color: var(--primary-color, #0f62fe);"></div></div>';
        html += '    <div class="chart-value">' + f.value + '</div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 6. Cost Structure
    if (data.cost_structure) {
      html += '<h5 class="report-heading">Cost Structure</h5>';
      html += '<div class="report-para">' + marked.parse(data.cost_structure) + '</div>';
    }

    // 7. Break-even Analysis
    if (data.break_even_analysis) {
      html += '<h5 class="report-heading">Break-even Analysis</h5>';
      html += '<div class="report-para">' + marked.parse(data.break_even_analysis) + '</div>';
    }

    // 8. Unit Economics
    if (data.unit_economics) {
      html += '<h5 class="report-heading">Unit Economics</h5>';
      html += '<div class="report-para">' + marked.parse(data.unit_economics) + '</div>';
    }

    // 9. Key Financial Metrics (KPI Cards Layout - Large Metric, Small Label, Description under 10 words)
    if (data.key_metrics && data.key_metrics.length) {
      html += '<h5 class="report-heading">Key Financial Metrics</h5>';
      html += '<div class="kpi-grid mb-4">';
      data.key_metrics.forEach(function(m) {
        html += '  <div class="kpi-card" style="border-top: 3px solid var(--primary-color, #0f62fe);">';
        html += '    <div class="kpi-label">' + m.label + '</div>';
        html += '    <div class="kpi-value" style="color: var(--primary-color, #0f62fe);">' + m.value + '</div>';
        html += '    <div class="kpi-desc">' + m.description + '</div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // 10. Profitability Outlook
    if (data.profitability_outlook) {
      html += '<h5 class="report-heading">Profitability Outlook</h5>';
      html += '<div class="report-para">' + marked.parse(data.profitability_outlook) + '</div>';
    }

    return html;
  }

  function renderGoToMarketHTML(data) {
    var html = '';
    var CHART_COLORS = ['#0f62fe', '#009d9a', '#8a3ffc', '#d14900'];

    // 1. GTM Overview Banner
    if (data.gtm_overview) {
      html += '<h5 class="report-heading">GTM Strategy Overview</h5>';
      html += '<div class="gtm-overview-banner">' + data.gtm_overview + '</div>';
    }

    // 2. Ideal Customer Profile (ICP) - Premium profile card
    if (data.icp) {
      var icp = data.icp;
      html += '<h5 class="report-heading">Ideal Customer Profile (ICP)</h5>';
      html += '<div class="gtm-icp-card">';
      html += '  <div class="gtm-icp-header">';
      html += '    <div class="gtm-icp-avatar"><i class="bi bi-person-fill"></i></div>';
      html += '    <div class="gtm-icp-header-text">';
      html += '      <h5>' + (icp.role || 'Target Buyer') + '</h5>';
      html += '      <span>' + (icp.industry || '') + (icp.geography ? ' &nbsp;&middot;&nbsp; ' + icp.geography : '') + '</span>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="gtm-icp-body">';
      html += '    <div class="gtm-icp-grid">';
      if (icp.company_size) {
        html += '      <div class="gtm-icp-field"><span class="gtm-icp-field-label">Company Size</span><span class="gtm-icp-field-value">' + icp.company_size + '</span></div>';
      }
      if (icp.industry) {
        html += '      <div class="gtm-icp-field"><span class="gtm-icp-field-label">Industry</span><span class="gtm-icp-field-value">' + icp.industry + '</span></div>';
      }
      if (icp.pain_point) {
        html += '      <div class="gtm-icp-field"><span class="gtm-icp-field-label">Core Pain Point</span><span class="gtm-icp-field-value">' + icp.pain_point + '</span></div>';
      }
      if (icp.budget) {
        html += '      <div class="gtm-icp-field"><span class="gtm-icp-field-label">Budget / Willingness to Pay</span><span class="gtm-icp-field-value">' + icp.budget + '</span></div>';
      }
      if (icp.buying_trigger) {
        html += '      <div class="gtm-icp-field" style="grid-column: 1 / -1;"><span class="gtm-icp-field-label">Buying Trigger</span><span class="gtm-icp-field-value">' + icp.buying_trigger + '</span></div>';
      }
      html += '    </div>';
      if (icp.cac) {
        html += '    <div class="gtm-icp-cac-banner">';
        html += '      <i class="bi bi-currency-dollar"></i>';
        html += '      <div>';
        html += '        <div class="gtm-icp-cac-label">Customer Acquisition Cost (CAC)</div>';
        html += '        <div class="gtm-icp-cac-value">' + icp.cac + '</div>';
        html += '      </div>';
        html += '    </div>';
      }
      html += '  </div>';
      html += '</div>';
    }

    // 3. Positioning Statement
    if (data.positioning_statement) {
      var ps = data.positioning_statement;
      html += '<h5 class="report-heading">Positioning Statement</h5>';
      html += '<div class="gtm-positioning-card">';
      html += '  <p class="gtm-positioning-text">';
      html += 'For <strong>' + (ps.for_whom || '-') + '</strong> who need ';
      html += '<strong>' + (ps.who_need || '-') + '</strong>, ';
      html += '<strong>' + (ps.product_name || '-') + '</strong> is a ';
      html += (ps.is_a || '-') + '. Unlike ';
      html += (ps.unlike || '-') + ', our product ';
      html += '<strong>' + (ps.our_product || '-') + '</strong>.';
      html += '  </p>';
      html += '</div>';
    }

    // 4. Marketing Channels - Feature cards grid
    if (data.marketing_channels && data.marketing_channels.length) {
      html += '<h5 class="report-heading">Marketing Channels</h5>';
      html += '<div class="gtm-channels-grid">';
      data.marketing_channels.forEach(function(ch) {
        var isPrimary = (ch.priority || '').toLowerCase() === 'primary';
        var cardClass = isPrimary ? 'primary-channel' : 'secondary-channel';
        var badgeClass = isPrimary ? 'priority-primary' : 'priority-secondary';
        var icon = ch.icon || 'bi-broadcast';
      html += '  <div class="gtm-channel-card ' + cardClass + '">';
        html += '    <div class="d-flex align-items-center gap-2">';
        html += '      <div class="gtm-channel-icon-wrap"><i class="bi ' + icon + '"></i></div>';
        html += '      <div>';
        html += '        <div class="gtm-channel-name">' + ch.name + '</div>';
        html += '        <span class="gtm-channel-priority ' + badgeClass + '">' + (ch.priority || 'Primary') + '</span>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div class="gtm-channel-desc">' + ch.description + '</div>';
        if (ch.expected_roi) {
          html += '    <div class="gtm-channel-roi"><i class="bi bi-graph-up-arrow"></i>' + ch.expected_roi + '</div>';
        }
        html += '  </div>';
      });
      html += '</div>';
    }

    // 5. Customer Acquisition Strategy
    if (data.acquisition_strategy) {
      var acq = data.acquisition_strategy;
      html += '<h5 class="report-heading">Customer Acquisition Strategy</h5>';
      if (acq.overview) {
        html += '<div class="report-para">' + acq.overview + '</div>';
      }
      if (acq.tactics && acq.tactics.length) {
        html += '<div class="gtm-strategy-grid">';
        acq.tactics.forEach(function(t, idx) {
          html += '  <div class="gtm-tactic-card">';
          html += '    <div class="gtm-tactic-num">' + (idx + 1) + '</div>';
          html += '    <div class="gtm-tactic-title">' + t.title + '</div>';
          html += '    <div class="gtm-tactic-desc">' + t.description + '</div>';
          html += '  </div>';
        });
        html += '</div>';
      }
    }

    // 6. Sales Strategy
    if (data.sales_strategy) {
      var sal = data.sales_strategy;
      html += '<h5 class="report-heading">Sales Strategy</h5>';
      if (sal.overview) {
        html += '<div class="report-para">' + sal.overview + '</div>';
      }
      if (sal.steps && sal.steps.length) {
        html += '<div class="gtm-sales-steps">';
        sal.steps.forEach(function(s, idx) {
          html += '  <div class="gtm-sales-step">';
          html += '    <div class="gtm-sales-step-num">' + (idx + 1) + '</div>';
          html += '    <div>';
          html += '      <div class="gtm-sales-step-title">' + s.title + '</div>';
          html += '      <div class="gtm-sales-step-desc">' + s.description + '</div>';
          html += '    </div>';
          html += '  </div>';
        });
        html += '</div>';
      }
    }
    // 7. 30/60/90-Day Launch Roadmap
    if (data.timeline && data.timeline.length) {
      html += '<h5 class="report-heading">30/60/90-Day Launch Roadmap</h5>';
      html += '<div class="gtm-timeline">';

      var badgeColors     = ['badge-day30', 'badge-day60', 'badge-day90'];
      var durationClasses = ['dur-30',      'dur-60',      'dur-90'];
      var defaultLabels   = ['Days 1\u201330', 'Days 31\u201360', 'Days 61\u201390'];

      data.timeline.forEach(function(t, idx) {
        var badgeClass   = badgeColors[idx]     || 'badge-day30';
        var durClass     = durationClasses[idx] || 'dur-30';
        var durationText = (t.phase && t.phase.trim()) ? t.phase : defaultLabels[idx] || ('Phase ' + (idx + 1));
        var titleText    = t.title || durationText;

        html += '<div class="timeline-item">';
        // Badge: ONLY the index number, never dynamic text
        html += '  <div class="timeline-badge ' + badgeClass + '">' + (idx + 1) + '</div>';
        html += '  <div class="timeline-content">';
        // Duration label: coloured uppercase text at top of card
        html += '    <div class="timeline-duration ' + durClass + '">' + durationText + '</div>';
        // Phase title
        html += '    <div class="timeline-title">' + titleText + '</div>';
        // Milestones (new schema) or plain description (old schema)
        if (t.milestones && t.milestones.length) {
          html += '    <ul class="timeline-milestones">';
          t.milestones.forEach(function(m) {
            html += '      <li>' + m + '</li>';
          });
          html += '    </ul>';
        } else if (t.description) {
          html += '    <p class="timeline-desc">' + t.description + '</p>';
        }
        // Key metric chip
        if (t.key_metric) {
          html += '    <div class="timeline-key-metric"><i class="bi bi-bullseye"></i>Target: ' + t.key_metric + '</div>';
        }
        html += '  </div>';
        html += '</div>';
      });

      html += '</div>';
    }


    // 8. Budget Allocation - Bar chart + Doughnut chart
    if (data.budget && data.budget.length) {
      var gtmChartId = 'gtmBudgetDonut_' + Date.now();
      html += '<h5 class="report-heading">Budget Allocation</h5>';
      html += '<div class="gtm-budget-layout">';

      // Bar chart
      html += '  <div class="chart-container">';
      html += '    <div class="chart-title">Monthly Spend Breakdown</div>';
      data.budget.forEach(function(b, idx) {
        var pct = b.percentage || 0;
        var color = CHART_COLORS[idx % CHART_COLORS.length];
        html += '    <div class="chart-row">';
        html += '      <div class="chart-label" title="' + b.label + '">' + b.label + '</div>';
        html += '      <div class="chart-bar-wrapper"><div class="chart-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>';
        html += '      <div class="chart-value">' + pct + '%</div>';
        if (b.amount_estimate) {
          html += '      <div class="chart-estimate">' + b.amount_estimate + '</div>';
        }
        html += '    </div>';
      });
      html += '  </div>';

      // Doughnut chart via Chart.js
      html += '  <div class="gtm-budget-donut-wrap">';
      html += '    <div class="gtm-donut-canvas-wrap">';
      html += '      <canvas id="' + gtmChartId + '" width="160" height="160"></canvas>';
      html += '      <div class="chart-title mt-2" style="font-size:.72rem;">Allocation</div>';
      html += '    </div>';
      html += '  </div>';

      html += '</div>';

      // Defer chart init until canvas is in DOM
      html += '<script>';
      html += '(function() {';
      html += '  var tryInit = function() {';
      html += '    var canvas = document.getElementById("' + gtmChartId + '");';
      html += '    if (!canvas) { setTimeout(tryInit, 100); return; }';
      html += '    if (typeof Chart === "undefined") { setTimeout(tryInit, 100); return; }';
      html += '    new Chart(canvas.getContext("2d"), {';
      html += '      type: "doughnut",';
      html += '      data: {';
      html += '        labels: [' + data.budget.map(function(b) { return '"' + b.label + '"'; }).join(',') + '],';
      html += '        datasets: [{';
      html += '          data: [' + data.budget.map(function(b) { return b.percentage || 0; }).join(',') + '],';
      html += '          backgroundColor: ["#0f62fe","#009d9a","#8a3ffc","#d14900"],';
      html += '          borderWidth: 2,';
      html += '          borderColor: "transparent",';
      html += '          hoverOffset: 6';
      html += '        }]';
      html += '      },';
      html += '      options: {';
      html += '        responsive: false,';
      html += '        cutout: "62%",';
      html += '        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return ctx.label + ": " + ctx.parsed + "%"; } } } }';
      html += '      }';
      html += '    });';
      html += '  };';
      html += '  tryInit();';
      html += '})();';
      html += '<\/script>';
    }

    // 9. Success KPIs - Stat card grid
    if (data.kpis && data.kpis.length) {
      var kpiAccentColors = ['#0f62fe', '#009d9a', '#8a3ffc', '#24a148', '#d14900'];
      html += '<h5 class="report-heading">Success KPIs</h5>';
      html += '<div class="gtm-kpi-grid">';
      data.kpis.forEach(function(k, idx) {
        var icon  = k.icon || 'bi-graph-up-arrow';
        var color = kpiAccentColors[idx % kpiAccentColors.length];
        
        // Safe cross-browser rgba calculation
        var hex = color.replace('#', '');
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        var iconBg = 'rgba(' + r + ',' + g + ',' + b + ',0.1)';

        html += '  <div class="gtm-kpi-card" style="border-top-color:' + color + ';">';
        html += '    <div class="gtm-kpi-icon" style="background:' + iconBg + ';color:' + color + ';">';
        html += '      <i class="bi ' + icon + '"></i>';
        html += '    </div>';
        html += '    <div class="gtm-kpi-value">' + k.value + '</div>';
        html += '    <div class="gtm-kpi-label" title="' + k.label + '">' + k.label + '</div>';
        if (k.description) {
          html += '    <div class="gtm-kpi-desc">' + k.description + '</div>';
        }
        html += '  </div>';
      });
      html += '</div>';
    }

    return html;
  }


  function renderRiskAnalysisHTML(data) {
    var html = '';
    // Risk Cards
    if (data.risks && data.risks.length) {
      html += '<div class="risk-grid">';
      data.risks.forEach(function(r) {
        var badgeClass = 'badge-high';
        var cardClass = 'risk-high';
        var sev = (r.severity || 'High Risk').toLowerCase();
        if (sev.indexOf('medium') !== -1 || sev.indexOf('low') !== -1) { badgeClass = 'badge-medium'; cardClass = 'risk-medium'; }
        
        // Resolve Probability and Impact with backwards compatibility lookup in matrix
        var probability = r.probability;
        var impact = r.impact;
        if (!probability || !impact) {
          if (data.matrix && data.matrix.length) {
            var match = data.matrix.find(function(m) {
              return m.description && (
                m.description.toLowerCase().indexOf(r.title.toLowerCase()) !== -1 ||
                r.title.toLowerCase().indexOf(m.description.toLowerCase()) !== -1
              );
            });
            if (match) {
              probability = probability || match.probability;
              impact = impact || match.impact;
            }
          }
        }
        probability = probability || 'Medium';
        impact = impact || 'High';

        html += '  <div class="risk-card ' + cardClass + '">';
        html += '    <span class="risk-badge ' + badgeClass + '">' + (r.severity || 'High Risk') + '</span>';
        html += '    <h5 class="risk-title">' + r.title + '</h5>';
        
        // Render Probability & Impact metadata row
        html += '    <div class="risk-meta-row">';
        html += '      <span class="risk-meta-item"><i class="bi bi-clock-history me-1"></i>Prob: &nbsp;<strong>' + probability + '</strong></span>';
        html += '      <span class="risk-meta-item"><i class="bi bi-lightning-charge me-1"></i>Impact: &nbsp;<strong>' + impact + '</strong></span>';
        html += '    </div>';
        
        html += '    <p><strong>Mitigation:</strong> ' + r.mitigation + '</p>';
        html += '  </div>';
      });
      html += '</div>';
    }


    // Risk Matrix Table
    if (data.matrix && data.matrix.length) {
      html += '<h5 class="report-heading">Risk Matrix & Priority</h5>';
      html += '<div class="table-responsive rounded-3 overflow-hidden border mb-4">';
      html += '  <table class="table table-striped table-bordered table-hover align-middle mb-0">';
      html += '    <thead><tr><th>Risk Description</th><th>Impact</th><th>Probability</th><th>Mitigation Cost</th><th>Priority Score</th></tr></thead>';
      html += '    <tbody>';
      data.matrix.forEach(function(r) {
        html += '      <tr>';
        html += '        <td><strong>' + r.description + '</strong></td>';
        html += '        <td>' + r.impact + '</td>';
        html += '        <td>' + r.probability + '</td>';
        html += '        <td>' + r.cost + '</td>';
        html += '        <td>' + r.priority + '</td>';
        html += '      </tr>';
      });
      html += '    </tbody>';
      html += '  </table>';
      html += '</div>';
    }

    // KPI Risk Monitoring Table
    if (data.kpis && data.kpis.length) {
      html += '<h5 class="report-heading">KPI Risk Monitoring Table</h5>';
      html += '<div class="table-responsive rounded-3 overflow-hidden border mb-4">';
      html += '  <table class="table table-striped table-bordered table-hover align-middle mb-0">';
      html += '    <thead><tr><th>Risk Area</th><th>Key Performance Indicator (KPI)</th><th>Safe Threshold</th><th>Trigger Point</th></tr></thead>';
      html += '    <tbody>';
      data.kpis.forEach(function(k) {
        html += '      <tr>';
        html += '        <td><strong>' + k.area + '</strong></td>';
        html += '        <td>' + k.kpi + '</td>';
        html += '        <td>' + k.safe + '</td>';
        html += '        <td>' + k.trigger + '</td>';
        html += '      </tr>';
      });
      html += '    </tbody>';
      html += '  </table>';
      html += '</div>';
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length) {
      html += '<h5 class="report-heading">Executive Recommendations</h5><ul class="report-list">';
      data.recommendations.forEach(function(r) { html += '<li>' + marked.parse(r) + '</li>'; });
      html += '</ul>';
    }
    return html;
  }

  /* === - Fetch model version from health endpoint -  */

  function fetchModelVersion() {
    if (!modelVersion) return;
    fetch(HEALTH_ENDPOINT)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.model) {
          var parts = d.model.split('/');
          modelVersion.textContent = parts[parts.length - 1] || d.model;
        }
      })
      .catch(function () { /* silent */ });
  }

  /* === - PDF Export / Print helpers -  */

  function bindPrintButton() {
    var downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', function () {
        populatePrintView();
        window.print();
      });
    }
  }

  function populatePrintView() {
    var printView = document.getElementById('blueprintPrintView');
    if (!printView || !blueprint) return;

    var name     = blueprint.startup_name    || 'Startup Blueprint';
    var industry = blueprint.industry        || '-';
    var audience = blueprint.target_audience || '-';
    var dateStr  = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    var html = '';

    // 1. Cover Page
    html += '<div class="print-cover">';
    html += '  <div class="print-cover-logo"><i class="bi bi-diagram-3-fill me-2"></i>Blueprint<strong>AI</strong></div>';
    html += '  <h1 class="print-cover-title">' + name + '</h1>';
    html += '  <p class="print-cover-subtitle">Startup Blueprint</p>';
    html += '  <div class="print-cover-meta">';
    html += '    <div class="print-cover-meta-item"><strong>Industry/Sector:</strong> ' + industry + '</div>';
    html += '    <div class="print-cover-meta-item"><strong>Target Audience:</strong> ' + audience + '</div>';
    html += '    <div class="print-cover-meta-item"><strong>Date Generated:</strong> ' + dateStr + '</div>';
    html += '  </div>';
    html += '</div>';

    // 2. Table of Contents
    html += '<div class="print-toc-page">';
    html += '  <h2 class="print-toc-title">Table of Contents</h2>';
    html += '  <ul class="print-toc-list">';
    
    var visibleIdx = 1;
    SECTIONS.forEach(function (sec) {
      if (blueprint.sections && blueprint.sections[sec.key]) {
        html += '    <li class="print-toc-item">';
        html += '      <a href="#print-sec-' + sec.key + '" class="print-toc-link">' + visibleIdx + '. ' + sec.label + '</a>';
        html += '    </li>';
        visibleIdx++;
      }
    });
    
    html += '  </ul>';
    html += '</div>';

    // 3. Sections
    SECTIONS.forEach(function (sec) {
      var secData = blueprint.sections && blueprint.sections[sec.key];
      if (secData && secData.html) {
        var parsedHtml = cleanAndPostProcessReport(secData.html);

        html += '<div class="print-section" id="print-sec-' + sec.key + '">';
        html += '  <h2 class="print-section-header">';
        html += '    <i class="bi ' + sec.icon + ' text-primary me-2"></i>' + sec.label;
        html += '  </h2>';
        html += '  <div class="print-section-content">' + parsedHtml + '</div>';
        html += '</div>';
      }
    });

    printView.innerHTML = html;
  }

  function renderFollowUpThread(sectionKey, isLoading) {
    if (!followUpThread || !blueprint) return;
    var history = (blueprint.followups && blueprint.followups[sectionKey]) || [];
    
    if (history.length === 0 && !isLoading) {
      followUpThread.innerHTML = '';
      followUpThread.classList.add('d-none');
      return;
    }
    
    var htmlText = '';
    history.forEach(function(msg) {
      if (msg.role === 'user') {
        htmlText += '<div class="follow-up-message follow-up-message-user">';
        htmlText += '  <div class="fw-semibold small text-primary mb-1">You</div>';
        htmlText += '  <div>' + escapeHtml(msg.content) + '</div>';
        htmlText += '</div>';
      } else {
        var friendlyText = "I have updated the " + getSectionLabel(sectionKey) + " section to apply your changes. The updated details are now live in the main report viewer.";
        htmlText += '<div class="follow-up-message follow-up-message-assistant">';
        htmlText += '  <div class="fw-semibold small text-success mb-1">Blueprint Assistant</div>';
        htmlText += '  <div>' + friendlyText + '</div>';
        htmlText += '</div>';
      }
    });
    
    if (isLoading) {
      htmlText += '<div class="follow-up-message follow-up-message-assistant opacity-75">';
      htmlText += '  <div class="fw-semibold small text-success mb-1">Blueprint Assistant</div>';
      htmlText += '  <div class="d-flex align-items-center gap-2">';
      htmlText += '    <span class="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>';
      htmlText += '    <span class="fst-italic text-muted">Updating section details...</span>';
      htmlText += '  </div>';
      htmlText += '</div>';
    }
    
    followUpThread.innerHTML = htmlText;
    followUpThread.classList.remove('d-none');
    
    // Auto-scroll to bottom of conversation thread
    setTimeout(function() {
      followUpThread.scrollTop = followUpThread.scrollHeight;
    }, 50);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSectionLabel(key) {
    var sec = SECTIONS.find(function(s) { return s.key === key; });
    return sec ? sec.label : key;
  }


  /* === - Boot -  */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
