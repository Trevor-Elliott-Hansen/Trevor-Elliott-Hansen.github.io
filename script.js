// ========================================
// SCROLL REVEAL — direction-aware parallax
// ========================================
let lastScrollY = window.scrollY;
let scrollDirection = 'down';

window.addEventListener('scroll', () => {
  scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
  lastScrollY = window.scrollY;
}, { passive: true });

const revealMobileMQ = window.matchMedia('(max-width: 768px)');
const revealTimers = new WeakMap();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [];
        const siblingIndex = siblings.indexOf(entry.target);
        const delay = siblingIndex > 0 ? siblingIndex * 100 : 0;

        // Set entry direction so CSS knows which way to animate in
        entry.target.classList.remove('from-above', 'from-below');
        entry.target.classList.add(scrollDirection === 'up' ? 'from-above' : 'from-below');

        clearTimeout(revealTimers.get(entry.target));
        revealTimers.set(entry.target, setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay));
      } else {
        clearTimeout(revealTimers.get(entry.target));
        revealTimers.delete(entry.target);
        // Reversible parallax on desktop; one-time reveals on mobile
        if (!revealMobileMQ.matches) {
          entry.target.classList.remove('visible');
        }
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => {
  el.classList.add('from-below'); // default hidden state: below
  revealObserver.observe(el);
});

// ========================================
// METRIC COUNT-UP
// ========================================
let metricsCounted = false;

const metricsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !metricsCounted) {
        metricsCounted = true;
        animateMetrics();
        metricsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const metricsEl = document.querySelector('.metrics');
if (metricsEl) {
  metricsObserver.observe(metricsEl);
}

function animateMetrics() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.metric-number').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = (n) => prefix + (n >= 1000 ? n.toLocaleString() : n.toString()) + suffix;

    if (reduce) {
      el.textContent = fmt(target);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = fmt(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });
}

// ========================================
// NAV SCROLL SPY
// ========================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter((e) => e.isIntersecting);
    if (!visible.length) return;
    // When several sections enter the band in one tick, highlight the one
    // lowest on screen — the section the user just scrolled to. Threshold 0
    // ensures short sections (Education) still register.
    const best = visible.reduce((a, b) =>
      a.boundingClientRect.top > b.boundingClientRect.top ? a : b
    );
    // #governance has no nav link of its own — the "Projects" link covers both
    const id = best.target.id === 'governance' ? 'project' : best.target.id;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  },
  { threshold: 0, rootMargin: '-72px 0px -60% 0px' }
);

sections.forEach((section) => {
  spyObserver.observe(section);
});

// (Timeline expand/collapse removed — details always visible)

// ========================================
// MOBILE NAV TOGGLE
// ========================================
const navToggle = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');

if (navToggle && navLinksContainer) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinksContainer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinksContainer.classList.remove('open');
    });
  });
}

// ========================================
// FEATURED PROJECT — count-up (generic, multi-group)
// ========================================
function animateCountGroup(rootEl) {
  if (rootEl.dataset.counted === 'true') return;
  rootEl.dataset.counted = 'true';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rootEl.querySelectorAll('.count-num').forEach((el) => {
    const target = parseFloat(el.dataset.target) || 0;
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = (n) => {
      const v = decimals ? n.toFixed(decimals) : Math.round(n);
      return prefix + (v >= 1000 ? Number(v).toLocaleString() : v.toString()) + suffix;
    };

    if (reduce) {
      el.textContent = fmt(target);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    function update(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = fmt(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCountGroup(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll('[data-count-group]').forEach((el) => countObserver.observe(el));

// ========================================
// FEATURED PROJECT — shared tab/panel widget
// ========================================
function initTabGroup(rootEl, data, renderFn, panelEl, defaultKey) {
  if (!rootEl || !panelEl) return;
  const tabs = Array.from(rootEl.querySelectorAll('.fp-tab'));
  if (!tabs.length) return;

  function select(tab, focusTab, isInit) {
    tabs.forEach((t) => {
      const sel = t === tab;
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.tabIndex = sel ? 0 : -1;
      t.classList.toggle('is-active', sel);
    });
    renderFn(tab.dataset.fpKey, data, panelEl);
    if (focusTab) tab.focus();
    // Gently bring a partially clipped panel into view on pointer selections
    // (no-op when fully visible or when the panel is display:none)
    if (!focusTab && !isInit) {
      panelEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  tabs.forEach((tab, i) => {
    tab.tabIndex = -1;
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      let idx = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = tabs.length - 1;
      if (idx !== null) {
        e.preventDefault();
        select(tabs[idx], true);
      }
    });
  });

  const initTab = (defaultKey && tabs.find((t) => t.dataset.fpKey === defaultKey)) || tabs[0];
  select(initTab, false, true);
}

function fpEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fpPillRow(label, items) {
  if (!items || !items.length) return '';
  return (
    '<div class="fp-detail-row"><span class="fp-detail-label">' + label + '</span>' +
    '<div class="fp-pill-row">' + items.map((t) => '<span class="pill">' + fpEsc(t) + '</span>').join('') + '</div></div>'
  );
}

// ========================================
// FEATURED PROJECT — data + renderers
// ========================================
const LINEAGE = {
  src_tpch: { name: 'SNOWFLAKE_SAMPLE_DATA.TPCH_SF1', rows: 'read-only share', purpose: 'Snowflake’s TPC-H sample dataset — the raw upstream source declared via dbt sources with freshness and schema tests.', tests: ['source freshness'], downstream: ['staging'] },
  stg_all: { name: 'staging · 7 views', rows: '8M+ total', purpose: 'Seven 1:1 staging views — rename, cast, and deterministic derivations only (net_revenue, is_returned, days_in_transit). No joins, no aggregation; every downstream model refs staging, never raw sources.', sql: 'extended_price * (1 - discount_rate) as net_revenue', tests: ['unique', 'not_null'], downstream: ['intermediate', 'dims'] },
  int_orders: { name: 'int_orders_with_line_items', rows: '1.5M', purpose: 'Pre-aggregates line items to order grain so fct_orders can join to dims without fan-out — the grain-discipline layer.', sql: 'sum(net_revenue) as order_net_revenue\nfrom stg_tpch__lineitems\ngroup by order_key', tests: ['unique', 'not_null'], downstream: ['fct_orders'] },
  dim_customer: { name: 'dim_customer', rows: '150K', purpose: 'Conformed customer dimension, denormalized with nation + region. The shared join key for the semantic layer.', tests: ['unique', 'not_null', 'relationships'], downstream: ['facts', 'semantic layer'] },
  dim_supplier: { name: 'dim_supplier', rows: '10K', purpose: 'Conformed supplier dimension, denormalized with nation + region.', tests: ['unique', 'not_null'], downstream: ['fct_order_items'] },
  dim_part: { name: 'dim_part', rows: '200K', purpose: 'Part dimension with parsed type sub-attributes (category / finish / material).', tests: ['unique', 'not_null'], downstream: ['fct_order_items'] },
  dim_customer_history: { name: 'dim_customer_history', rows: 'variable', purpose: 'SCD Type 2 history with is_current flag and valid_to_or_max for clean point-in-time joins — see The SCD2 Bug tab for the debugging story.', sql: 'on o.customer_key = h.customer_key\nand o.order_date >= h.valid_from\nand o.order_date < h.valid_to_or_max', tests: ['one current per key'], downstream: ['point-in-time analysis'] },
  fct_orders: { name: 'fct_orders', rows: '1.5M', purpose: 'Fact at order grain — header combined with the pre-aggregated line-item rollup. Answers order-level questions like average order value.', tests: ['unique', 'not_null', 'revenue reconciles'], downstream: ['BI / semantic'] },
  fct_order_items: { name: 'fct_order_items', rows: '6M', purpose: 'Fact at line-item grain with a surrogate key. Denormalizes order context (customer_key, order_date, status) so most queries need no extra join. Converted to incremental by the governed agent in Project 02 — 9,779-row runs instead of 6M.', tests: ['unique', 'positive value', 'relationships'], downstream: ['semantic layer'] },
  sem_layer: { name: 'MetricFlow semantic layer', rows: '16 metrics', purpose: 'Two semantic models over the facts and dims define 16 version-controlled metrics, joined automatically through shared entities. dim_dates provides the time spine. See the Semantic Layer tab for the live demo.', downstream: ['any BI tool'] }
};

function renderLineage(key, data, panel) {
  const d = data[key];
  if (!d) { panel.innerHTML = ''; return; }
  const rows = d.rows ? '<span class="fp-detail-rows">' + fpEsc(d.rows) + '</span>' : '';
  const sql = d.sql ? '<pre><code>' + fpEsc(d.sql) + '</code></pre>' : '';
  panel.innerHTML =
    '<div class="fp-detail-head"><span class="fp-detail-name">' + fpEsc(d.name) + '</span>' + rows + '</div>' +
    '<p class="fp-detail-purpose">' + fpEsc(d.purpose) + '</p>' +
    sql +
    fpPillRow('Tests', d.tests) +
    fpPillRow('Feeds', d.downstream);
}

const SEMANTIC_RESULTS = {
  region: {
    dim: 'customer__region_name',
    columns: ['region', 'net_revenue', 'orders', 'avg_order_value'],
    rows: [
      ['AMERICA', '$1.34B', '300,191', '$4,471'],
      ['ASIA', '$1.34B', '300,402', '$4,459'],
      ['EUROPE', '$1.33B', '299,884', '$4,442'],
      ['MIDDLE EAST', '$1.33B', '300,511', '$4,428'],
      ['AFRICA', '$1.32B', '299,012', '$4,415']
    ]
  },
  segment: {
    dim: 'customer__market_segment',
    columns: ['market_segment', 'net_revenue', 'orders', 'avg_order_value'],
    rows: [
      ['BUILDING', '$1.34B', '300,920', '$4,451'],
      ['MACHINERY', '$1.33B', '299,230', '$4,455'],
      ['HOUSEHOLD', '$1.33B', '300,110', '$4,447'],
      ['AUTOMOBILE', '$1.33B', '300,180', '$4,442'],
      ['FURNITURE', '$1.33B', '299,560', '$4,438']
    ]
  }
};

function renderSemanticResult(key, data, panel) {
  const r = data[key];
  if (!r) return;
  const cli = document.getElementById('fp-cli-dim');
  if (cli) cli.textContent = r.dim;
  const head = '<tr>' + r.columns.map((c) => '<th scope="col">' + fpEsc(c) + '</th>').join('') + '</tr>';
  const body = r.rows.map((row) => '<tr>' + row.map((c) => '<td>' + fpEsc(c) + '</td>').join('') + '</tr>').join('');
  panel.innerHTML = '<table class="fp-result-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
}

// ========================================
// ANALYTICS — CTA click events (GA4)
// ========================================
function trackCta(selector, eventName) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', eventName, { link_text: el.textContent.trim().slice(0, 60) });
      }
    });
  });
}

trackCta('.hero-chip', 'hero_chip_click');
trackCta('.hero-buttons a[href="#project"]', 'hero_project_cta_click');
trackCta('#project .fp-cta a', 'github_repo_click');
trackCta('#governance .fp-cta a', 'governance_repo_click');
trackCta('a[href*="linkedin.com"]', 'linkedin_click');
trackCta('#contact a[href^="mailto"]', 'email_click');

// ========================================
// MOBILE BOTTOM SHEET — lineage details
// ========================================
const fpSheet = document.getElementById('fp-sheet');
const fpSheetBackdrop = document.getElementById('fp-sheet-backdrop');
const fpSheetClose = document.getElementById('fp-sheet-close');
const fpSheetContent = document.getElementById('fp-sheet-content');
const fpMobileMQ = window.matchMedia('(max-width: 768px)');

let fpSheetTrigger = null; // focus restore target
let fpSheetWanted = false; // set by pointer click, consumed by the render wrapper

function fpSheetKeydown(e) {
  if (e.key === 'Escape') closeFpSheet();
}

function fpSheetFocusGuard(e) {
  if (fpSheet.classList.contains('open') && !fpSheet.contains(e.target)) {
    fpSheetClose.focus();
  }
}

function openFpSheet(trigger) {
  fpSheetTrigger = trigger;
  fpSheet.classList.add('open');
  fpSheetBackdrop.classList.add('open');
  document.body.classList.add('fp-sheet-lock');
  document.addEventListener('keydown', fpSheetKeydown);
  document.addEventListener('focusin', fpSheetFocusGuard);
  fpSheetClose.focus();
}

function closeFpSheet() {
  fpSheet.classList.remove('open');
  fpSheetBackdrop.classList.remove('open');
  document.body.classList.remove('fp-sheet-lock');
  document.removeEventListener('keydown', fpSheetKeydown);
  document.removeEventListener('focusin', fpSheetFocusGuard);
  if (fpSheetTrigger) {
    fpSheetTrigger.focus();
    fpSheetTrigger = null;
  }
}

if (fpSheet) {
  fpSheetClose.addEventListener('click', closeFpSheet);
  fpSheetBackdrop.addEventListener('click', closeFpSheet);
  fpMobileMQ.addEventListener('change', (e) => {
    if (!e.matches) closeFpSheet();
  });
}

// Capture-phase delegated listener (document-level, serves every .fp-node
// tab group): records the trigger BEFORE the tab's own click handler runs
// select() -> renderFn, and fires the GA engagement event with the owning
// section as the project discriminator.
document.addEventListener('click', (e) => {
  const btn = e.target.closest ? e.target.closest('.fp-node') : null;
  if (!btn) return;
  fpSheetWanted = true;
  fpSheetTrigger = btn;
  if (typeof gtag === 'function') {
    const section = btn.closest('section[id]');
    gtag('event', 'fp_node_click', {
      model_key: btn.dataset.fpKey,
      model_name: btn.textContent.trim(),
      project: section ? section.id : ''
    });
  }
}, true);

// Render-wrapper factory: desktop -> the block's own panel; mobile pointer-tap
// -> the shared bottom sheet. The desktop panel still renders on mobile
// (cheap, display:none) so the tabs' aria-controls target stays current;
// the dialog supersedes it visually.
function withMobileSheet(renderFn) {
  return function (key, data, panel) {
    renderFn(key, data, panel);
    if (fpMobileMQ.matches && fpSheetWanted && fpSheet) {
      renderFn(key, data, fpSheetContent);
      openFpSheet(fpSheetTrigger);
    }
    fpSheetWanted = false;
  };
}

// ========================================
// PROJECT 02 — governance stack data + renderer
// ========================================
const GOVSTACK = {
  env: {
    name: '01 · Environment & Spend',
    artifact: 'setup/setup.sql · setup/ci_user.sql',
    purpose: 'Cost caps and role scoping armed before the agent got its first token: a 50-credit resource monitor with hard suspend, per-user daily CoCo credit limits, least-privilege TRANSFORMER role, MFA for humans and RSA key-pair auth for the machine.',
    proof: { src: 'assets/proof-resource-monitor.png', w: 1560, h: 652, alt: 'Snowsight resource monitor showing 1.36 of 50 credits used', caption: 'Live proof — the entire project ran on 1.36 of 50 capped credits' },
    tests: ['50-credit hard cap', '5 credits/day per user', 'key-pair service auth']
  },
  advice: {
    name: '02 · Advice',
    artifact: 'AGENTS.md',
    purpose: 'Conventions and architectural intent the agent reads: naming taxonomy, the semantic-layer rule (never materialize what MetricFlow already answers), verify-don’t-declare. Written FROM the ungoverned baseline’s failures, the way real org conventions evolve.',
    tests: ['refused semantic-layer duplication', 'self-verified with dbt build']
  },
  runbook: {
    name: '03 · Runbook',
    artifact: '.cortex/plugins/tpch-conventions/skills/add-staging-model/',
    purpose: 'A five-phase gated workflow (preconditions → model → docs/tests → verify → report) the agent executes rather than improvises. First live run: a clean-sweep composite-PK staging model whose self-reported numbers matched independent re-verification exactly.',
    tests: ['8/8 build', '5/5 source tests', 'lint clean']
  },
  enforce: {
    name: '04 · Enforcement',
    artifact: '.cortex/plugins/tpch-conventions/hooks/guardrails.sh',
    purpose: 'A PreToolUse hook inspects every command before execution: no prod targets, no stateful snapshot runs, no destructive DDL outside dev schemas, no warehouse or spend changes. Deterministic blocks the agent cannot talk past — see the pressure test below.',
    proof: { src: 'assets/proof-hook-block.png', w: 882, h: 1624, alt: 'CoCo Desktop session where the guardrail hook blocks dbt snapshot --help', caption: 'Live capture — the hook firing on a harmless-looking command' },
    tests: ['11 simulated commands: 6 block, 5 pass']
  },
  review: {
    name: '05 · Scoped Review',
    artifact: '.cortex/plugins/tpch-conventions/agents/dbt-reviewer.md',
    purpose: 'A read-only reviewer whose least-privilege is structural — a tool allowlist (read/grep/glob), not prompt promises. Against 8 planted defects: 7 caught, 0 false positives. The one miss (a silent deletion) produced the design rule: reviewers need diffs as input, not git as a capability.',
    tests: ['7/8 defects caught', '0 false positives', 'fails closed']
  },
  shipped: {
    name: 'Shipped: plugin → catalog → CI',
    artifact: '.cortex/plugins/tpch-conventions/ → CORTEX EXTENSION',
    purpose: 'All five layers ship as one versioned plugin, published to Snowflake’s catalog with READ granted only to the TRANSFORMER role — agent tooling governed by the same RBAC as the data. The same reviewer then runs headless in CI on every PR under a service identity with a role-restricted expiring token. Its first act was reviewing the PR that created it.',
    proof: { src: 'assets/proof-rbac-grants.png', w: 1314, h: 706, alt: 'Snowsight grants on the CORTEX EXTENSION: OWNERSHIP to ADMIN, READ to TRANSFORMER role', caption: 'Live proof — OWNERSHIP to admin, READ scoped to the TRANSFORMER role' },
    tests: ['deliberately not PUBLIC', 'a human merges; the agent informs']
  }
};

function renderGovLayer(key, data, panel) {
  const d = data[key];
  if (!d) { panel.innerHTML = ''; return; }
  const proof = d.proof
    ? '<figure class="fp-proof"><img src="' + d.proof.src + '" alt="' + fpEsc(d.proof.alt) + '" width="' + d.proof.w + '" height="' + d.proof.h + '" loading="lazy"><figcaption class="fp-proof-caption">' + fpEsc(d.proof.caption) + '</figcaption></figure>'
    : '';
  panel.innerHTML =
    '<div class="fp-detail-head"><span class="fp-detail-name">' + fpEsc(d.name) + '</span></div>' +
    '<div class="fp-detail-row"><span class="fp-detail-label">Artifact</span><div class="fp-pill-row"><span class="pill">' + fpEsc(d.artifact) + '</span></div></div>' +
    '<p class="fp-detail-purpose" style="margin-top:12px">' + fpEsc(d.purpose) + '</p>' +
    fpPillRow('Proven', d.tests) +
    proof;
}

// ========================================
// EXPLORER — one tabbed block per project
// ========================================
function initExplorer(tabsEl) {
  const tabs = Array.from(tabsEl.querySelectorAll('.fp-etab'));
  if (!tabs.length) return;
  const blockEl = tabsEl.parentElement;
  const panels = tabs.map((t) => blockEl.querySelector('#' + t.dataset.etab));

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t, j) => {
        const sel = t === tab;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        if (panels[j]) panels[j].hidden = !sel;
      });
      if (typeof gtag === 'function') {
        const section = tabsEl.closest('section[id]');
        gtag('event', 'fp_tab_view', {
          tab: tab.dataset.etab,
          project: section ? section.id : ''
        });
      }
    });
  });
}

document.querySelectorAll('.fp-explorer-tabs').forEach(initExplorer);

// Wire up the tab groups
initTabGroup(document.getElementById('fp-lineage-block'), LINEAGE, withMobileSheet(renderLineage), document.getElementById('fp-lineage-panel'), 'fct_order_items');
initTabGroup(document.getElementById('fp-semantic-toggle'), SEMANTIC_RESULTS, renderSemanticResult, document.getElementById('fp-semantic-panel'), 'region');
initTabGroup(document.getElementById('gv-stack-block'), GOVSTACK, withMobileSheet(renderGovLayer), document.getElementById('gv-stack-panel'), 'env');
