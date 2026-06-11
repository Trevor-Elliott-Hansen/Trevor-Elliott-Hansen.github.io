// ========================================
// SCROLL REVEAL — direction-aware parallax
// ========================================
let lastScrollY = window.scrollY;
let scrollDirection = 'down';

window.addEventListener('scroll', () => {
  scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
  lastScrollY = window.scrollY;
}, { passive: true });

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

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
      } else {
        entry.target.classList.remove('visible');
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
  document.querySelectorAll('.metric-number').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      // Format with commas for numbers >= 1000
      const formatted = current >= 1000
        ? current.toLocaleString()
        : current.toString();

      el.textContent = prefix + formatted + suffix;

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
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  { threshold: 0.2, rootMargin: '-72px 0px -50% 0px' }
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
    const target = parseInt(el.dataset.target, 10) || 0;
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
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = fmt(Math.round(eased * target));
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

  function select(tab, focusTab) {
    tabs.forEach((t) => {
      const sel = t === tab;
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.tabIndex = sel ? 0 : -1;
      t.classList.toggle('is-active', sel);
    });
    renderFn(tab.dataset.fpKey, data, panelEl);
    if (focusTab) tab.focus();
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
  select(initTab, false);
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
  stg_orders: { name: 'stg_tpch__orders', rows: '1.5M', purpose: 'Order header: 1:1 rename + cast from the raw source. Staging never joins or aggregates.', tests: ['unique', 'not_null'], downstream: ['int_orders_with_line_items', 'fct_orders'] },
  stg_lineitems: { name: 'stg_tpch__lineitems', rows: '6M', purpose: 'Line items with deterministic derivations: net_revenue, discount_amount, is_returned, days_in_transit.', sql: 'extended_price * (1 - discount_rate) as net_revenue', tests: ['not_null'], downstream: ['int_orders_with_line_items', 'fct_order_items'] },
  stg_customers: { name: 'stg_tpch__customers', rows: '150K', purpose: 'Customer master rename + cast.', tests: ['unique', 'not_null'], downstream: ['dim_customer'] },
  stg_suppliers: { name: 'stg_tpch__suppliers', rows: '10K', purpose: 'Supplier master rename + cast.', tests: ['unique', 'not_null'], downstream: ['dim_supplier'] },
  stg_parts: { name: 'stg_tpch__parts', rows: '200K', purpose: 'Part master with p_type parsed into category / finish / material sub-attributes.', tests: ['unique', 'not_null'], downstream: ['dim_part'] },
  stg_nations: { name: 'stg_tpch__nations', rows: '25', purpose: 'Nation lookup, used to denormalize geography into dims.', downstream: ['dim_customer', 'dim_supplier'] },
  stg_regions: { name: 'stg_tpch__regions', rows: '5', purpose: 'Region lookup, the top of the geography rollup.', downstream: ['dim_customer', 'dim_supplier'] },
  int_orders: { name: 'int_orders_with_line_items', rows: '1.5M', purpose: 'Pre-aggregates line items to order grain so fct_orders can join to dims without fan-out.', sql: 'sum(net_revenue) as order_net_revenue\nfrom stg_tpch__lineitems\ngroup by order_key', tests: ['unique', 'not_null'], downstream: ['fct_orders'] },
  dim_customer: { name: 'dim_customer', rows: '150K', purpose: 'Conformed customer dimension, denormalized with nation + region. The shared join key for the semantic layer.', tests: ['unique', 'not_null', 'relationships'], downstream: ['fct_orders', 'fct_order_items', 'sem_customers'] },
  dim_supplier: { name: 'dim_supplier', rows: '10K', purpose: 'Conformed supplier dimension, denormalized with nation + region.', tests: ['unique', 'not_null'], downstream: ['fct_order_items'] },
  dim_part: { name: 'dim_part', rows: '200K', purpose: 'Part dimension with parsed type sub-attributes (category / finish / material).', tests: ['unique', 'not_null'], downstream: ['fct_order_items'] },
  dim_customer_history: { name: 'dim_customer_history', rows: 'variable', purpose: 'SCD Type 2 history with is_current flag and valid_to_or_max for clean point-in-time joins.', sql: 'on o.customer_key = h.customer_key\nand o.order_date >= h.valid_from\nand o.order_date < h.valid_to_or_max', tests: ['one current per key'], downstream: ['point-in-time analysis'] },
  fct_orders: { name: 'fct_orders', rows: '1.5M', purpose: 'Fact at order grain — header combined with the pre-aggregated line-item rollup. Answers order-level questions like average order value.', tests: ['unique', 'not_null', 'revenue reconciles'], downstream: ['BI / semantic'] },
  fct_order_items: { name: 'fct_order_items', rows: '6M', purpose: 'Fact at line-item grain with a dbt_utils surrogate key. Denormalizes order context (customer_key, order_date, status) so most queries need no extra join.', tests: ['unique', 'positive value', 'relationships'], downstream: ['sem_order_items'] },
  sem_order_items: { name: 'sem_order_items', rows: 'semantic', purpose: 'MetricFlow semantic model over fct_order_items: 9 measures, 7 dimensions, 5 entities (primary order_item; foreign order, customer, supplier, part).', downstream: ['metrics'] },
  sem_customers: { name: 'sem_customers', rows: 'semantic', purpose: 'Semantic model over dim_customer with customer as the primary entity. The shared entity name is what enables auto-joins.', downstream: ['metrics'] },
  dim_dates: { name: 'dim_dates', rows: '~15K', purpose: 'Day-grain calendar (1990–2030). Serves as the MetricFlow time spine and a general date dimension.', downstream: ['time-based metrics'] },
  seed_customer_changes: { name: 'customer_changes_simulated', rows: '10', purpose: 'Current-state seed (one row per customer) that feeds the SCD2 snapshot. Editing a tracked column simulates a real attribute change.', downstream: ['customer_snapshot'] },
  snap_customer: { name: 'customer_snapshot', rows: 'variable', purpose: 'dbt snapshot using the check strategy over tracked columns. Closes the prior version and opens a new one whenever a tracked column changes.', sql: 'strategy: check\ncheck_cols: [market_segment, account_balance]', downstream: ['dim_customer_history'] }
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

const PLAYGROUND = {
  region: {
    sql: 'select\n    c.region_name,\n    sum(oi.net_revenue) as net_revenue\nfrom fct_order_items oi\njoin dim_customer c using (customer_key)\ngroup by 1\norder by 2 desc;',
    models: ['fct_order_items', 'dim_customer'],
    metrics: ['total_net_revenue'],
    concept: 'Conformed dimension: region rolls up customer → nation → region, joined once and reused everywhere.'
  },
  top_customers: {
    sql: 'select\n    c.customer_key,\n    c.market_segment,\n    sum(oi.net_revenue) as net_revenue\nfrom fct_order_items oi\njoin dim_customer c using (customer_key)\ngroup by 1, 2\norder by net_revenue desc\nlimit 10;',
    models: ['fct_order_items', 'dim_customer'],
    metrics: ['total_net_revenue'],
    concept: 'Line-item grain fact carries customer_key directly — no detour through fct_orders needed.'
  },
  return_rate: {
    sql: 'select\n    p.category,\n    count_if(oi.is_returned) * 100.0\n      / nullif(count(*), 0) as return_rate_pct\nfrom fct_order_items oi\njoin dim_part p using (part_key)\ngroup by 1\norder by return_rate_pct desc;',
    models: ['fct_order_items', 'dim_part'],
    metrics: ['return_rate', 'line_item_count', 'returned_item_count'],
    concept: 'Derived metric: return_rate = returned_item_count / line_item_count, sliced by a parsed part attribute.'
  },
  segment_history: {
    sql: 'select\n    h.market_segment,\n    sum(o.net_revenue) as revenue\nfrom fct_orders o\njoin dim_customer_history h\n  on o.customer_key = h.customer_key\n  and o.order_date >= h.valid_from\n  and o.order_date < h.valid_to_or_max\ngroup by 1;',
    models: ['fct_orders', 'dim_customer_history'],
    metrics: ['total_net_revenue'],
    concept: 'SCD Type 2 point-in-time join: attributes revenue to the segment the customer was in when the order was placed, not their segment today.'
  }
};

function renderPlayground(key, data, panel) {
  const d = data[key];
  if (!d) return;
  panel.innerHTML =
    '<pre><code>' + fpEsc(d.sql) + '</code></pre>' +
    fpPillRow('Models', d.models) +
    fpPillRow('Metrics', d.metrics) +
    '<p class="fp-concept">' + fpEsc(d.concept) + '</p>';
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
trackCta('.fp-cta a', 'github_repo_click');
trackCta('a[href*="linkedin.com"]', 'linkedin_click');
trackCta('#contact a[href^="mailto"]', 'email_click');

// Wire up the three tab groups
initTabGroup(document.getElementById('fp-lineage-block'), LINEAGE, renderLineage, document.getElementById('fp-lineage-panel'), 'sem_order_items');
initTabGroup(document.getElementById('fp-semantic-toggle'), SEMANTIC_RESULTS, renderSemanticResult, document.getElementById('fp-semantic-panel'), 'region');
initTabGroup(document.getElementById('fp-playground-list'), PLAYGROUND, renderPlayground, document.getElementById('fp-playground-panel'), 'region');
