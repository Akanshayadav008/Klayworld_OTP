// src/components/ExportProductsPDFButton.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "./../../firebaseConfig";
import { collection, query, where, getDocs, limit } from "firebase/firestore";


/* ======================= Image helpers ======================= */

const firstImageUrl = (p) => {
  const pick = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const candidates = [
    ...pick(p?.tileImage),
    ...pick(p?.image),
    ...pick(p?.images),
    ...pick(p?.images?.[0]),
    ...pick(p?.images?.[0]?.url),
    ...pick(p?.images?.url),
    ...pick(p?.["Tile Image"]),
    ...pick(p?.technicalImage),
    ...pick(p?.highlighterRendersURL),
    ...pick(p?.selectedImage),
    ...pick(p?.primaryImage),
    ...pick(p?.productImage),
    ...pick(p?.thumbnail),
    ...pick(p?.thumb),
    ...pick(p?.img),
    ...pick(p?.image_url),
    ...pick(p?.imageUrl),
  ]
    .flat()
    .filter(Boolean);

  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) return c;
  }
  return "";
};

const fetchAsDataURL = async (url) => {
  if (!url) return "";
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  } catch (e1) {
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 256;
            canvas.height = img.naturalHeight || img.height || 256;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    } catch {
      console.warn("[PDF] image failed", url);
      return "";
    }
  }
};


/* ======================= Value helpers ======================= */

const isSample = (p) =>
  p?.sample === true ||
  p?.isSample === true ||
  p?.sample === 1 ||
  (typeof p?.sample === "string" && p.sample.toLowerCase() === "true");

const parsePrice = (val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const takeText = (x) => {
  if (x === 0) return "0";
  if (!x) return null;
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object")
    return x.name ?? x.value ?? x.label ?? x.text ?? null;
  return null;
};

const collectTexts = (val) => {
  if (val === 0) return ["0"];
  if (!val) return [];
  if (Array.isArray(val))
    return val
      .map(collectTexts)
      .flat()
      .map((t) => (t == null ? null : String(t)))
      .filter(Boolean);
  const t = takeText(val);
  return t == null ? [] : [String(t)];
};


/* ======================= PDF text sanitization ======================= */

// Replace unsupported glyphs (e.g., rupee) & strip control chars
const sanitize = (s) => {
  if (s == null) return "";
  let out = String(s);
  out = out.replace(/₹/g, "Rs ");
  out = out.replace(/[\u0000-\u001F\u007F]/g, "");
  return out;
};

const joinDisplay = (arr) => sanitize(arr.filter((x) => x != null).join(", "));


/* ======================= Product field formatting ======================= */

const pretty = (v) => {
  if (v == null) return "";
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  )
    return sanitize(v);
  if (Array.isArray(v)) {
    const allPrimitive = v.every(
      (x) => x == null || ["string", "number", "boolean"].includes(typeof x)
    );
    if (allPrimitive) return joinDisplay(v);
    try {
      return sanitize(JSON.stringify(v, null, 2));
    } catch {
      return sanitize(String(v));
    }
  }
  try {
    return sanitize(JSON.stringify(v, null, 2));
  } catch {
    return sanitize(String(v));
  }
};

const detailPairs = (p) => {
  if (!p || typeof p !== "object") return [];

  // Skip images, selecteds, and your requested exclusions (with common variants)
  const SKIP_KEYS = new Set([
    // existing skips
    "size",
    "variation",
    "image",
    "tileImage",
    "technicalImage",
    "highlighterRendersURL",
    "images",
    "selectedImage",
    "primaryImage",
    "productImage",
    "thumbnail",
    "thumb",
    "img",
    "image_url",
    "imageUrl",
    "quantity",
    "selectedSize",
    "selectedFinish",
    "selectedThickness",
    "selectedPrice",
 "sample",
    "isSample",
    "issample",
    "is_sample",
    "sample_flag",
    "sampletrue",
    "sample true",

    // requested removals + variants
    // add to SKIP_KEYS
"id",
"Id",
"ID",
"pincode",
"pin_code",
"Pin Code",
"postalCode",
"postal_code",
"zip",
"zipcode",
"Zip Code",
    "product_id",
    "productId",
    "ProductID",
    "vendor_id",
    "vendorId",
    "VendorID",
    "meta_view",
    "metaView",
    "MetaView",
    "new",
    "isNew",
    "space",
    "Space",
    "attributes",
    "attribute",
    "Attributes",
    "tags",
    "tag",
    "Tags",
    "Brand",
    "brand",
    "location",
    "Location",
    "review",
    "reviews",
    "Review",
    "Reviews",
    "rating",
    "ratings",
    "Rating",
    "Ratings",
  ]);

  const pairs = [];
  for (const k of Object.keys(p)) {
    if (SKIP_KEYS.has(k)) continue;
    const title = k
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (m) => m.toUpperCase());
    pairs.push([title, pretty(p[k])]);
  }
  return pairs;
};

// NORMALIZE variation/size labels so no [object Object]
const extractVariations = (p) => {
  const rows = [];
  const mkLabel = (x) => {
    const parts = [...collectTexts(x?.name), ...collectTexts(x?.size)];
    return parts.length ? parts.join(", ") : "-";
  };
  const mkExtra = (obj) =>
    Object.keys(obj || {})
      .filter((k) => !["name", "price", "sampleStock", "stock", "size"].includes(k))
      .map((k) => `${k}: ${pretty(obj[k])}`)
      .join("\n");

  if (Array.isArray(p?.size)) {
    for (const s of p.size) {
      if (s && typeof s === "object") {
        rows.push({
          label: mkLabel(s),
          price: s.price ?? s.Price ?? s.rate ?? "",
          stock: s.sampleStock ?? s.stock ?? "",
          extra: mkExtra(s),
        });
      }
    }
  }
  if (Array.isArray(p?.variation)) {
    for (const v of p.variation) {
      if (v && typeof v === "object") {
        rows.push({
          label: mkLabel(v),
          price: v.price ?? v.Price ?? v.rate ?? "",
          stock: v.sampleStock ?? v.stock ?? "",
          extra: mkExtra(v),
        });
      }
    }
  }
  return rows;
};

const allImageUrls = (p, max = 8) => {
  const pick = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const pools = [
    ...pick(p?.image),
    ...pick(p?.tileImage),
    ...pick(p?.technicalImage),
    ...pick(p?.highlighterRendersURL),
    ...pick(p?.images),
    ...pick(p?.images?.[0]),
    ...pick(p?.images?.url),
    ...pick(p?.imageUrl),
    ...pick(p?.image_url),
    ...pick(p?.productImage),
    ...pick(p?.thumbnail),
    ...pick(p?.thumb),
    ...pick(p?.img),
  ].flat();

  const urls = [];
  for (const x of pools) {
    if (typeof x === "string" && /^https?:\/\//i.test(x)) urls.push(x);
    if (urls.length >= max) break;
  }
  return Array.from(new Set(urls));
};


/* ======================= Firestore lookup ======================= */

const productCache = new Map();

const pickSingle = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.find((x) => typeof x === "string") || null;
  return null;
};

const displayNameOf = (p) =>
  takeText(p?.meta_view?.name ?? p?.meta_view) ?? takeText(p?.name) ?? null;

const findProductForCartItem = async (cartItem) => {
  const idCandidate =
    pickSingle(cartItem?.product_id) || pickSingle(cartItem?.id) || null;

  const key = JSON.stringify({
    id: idCandidate,
    name: displayNameOf(cartItem),
  });
  if (productCache.has(key)) return productCache.get(key);

  const colRef = collection(db, "products");

  // 1) by product_id
  if (idCandidate) {
    try {
      const q1 = query(
        colRef,
        where("product_id", "array-contains", idCandidate),
        limit(1)
      );
      const s1 = await getDocs(q1);
      if (!s1.empty) {
        const docData = s1.docs[0].data();
        productCache.set(key, docData);
        return docData;
      }
    } catch {}
  }

  const name = displayNameOf(cartItem);
  if (name) {
    // 2) name
    try {
      const q2 = query(colRef, where("name", "==", name), limit(1));
      const s2 = await getDocs(q2);
      if (!s2.empty) {
        const docData = s2.docs[0].data();
        productCache.set(key, docData);
        return docData;
      }
    } catch {}
    // 3) meta_view.name
    try {
      const q3 = query(colRef, where("meta_view.name", "==", name), limit(1));
      const s3 = await getDocs(q3);
      if (!s3.empty) {
        const docData = s3.docs[0].data();
        productCache.set(key, docData);
        return docData;
      }
    } catch {}
    // 4) meta_view (string)
    try {
      const q4 = query(colRef, where("meta_view", "==", name), limit(1));
      const s4 = await getDocs(q4);
      if (!s4.empty) {
        const docData = s4.docs[0].data();
        productCache.set(key, docData);
        return docData;
      }
    } catch {}
  }

  productCache.set(key, null);
  return null;
};


/* ======================= Component ======================= */

export default function ExportProductsPDFButton({ products: cartItemsProp = [] }) {
  const [loading, setLoading] = useState(false);

  const normalizeCartItem = (p) => {
    const name =
      p?.name ??
      p?.meta_view ??
      p?.shortDescription ??
      p?.["short description"] ??
      "-";

    const sizeParts = [
      ...collectTexts(p?.selectedSize),
      ...collectTexts(p?.size),
      ...collectTexts(p?.Size),
      ...(Array.isArray(p?.variation)
        ? p.variation.flatMap((v) => [
            ...collectTexts(v?.name),
            ...collectTexts(v?.size),
          ])
        : []),
      ...collectTexts(p?.dimensions),
      ...collectTexts(p?.dimension),
    ];
    const size = sizeParts.length ? [...new Set(sizeParts)].join(", ") : "-";

    const thicknessParts = [
      ...collectTexts(p?.selectedThickness),
      ...collectTexts(p?.thickness),
      ...collectTexts(p?.Thickness),
      ...collectTexts(p?.thinkness),
      ...collectTexts(p?.Thinkness),
      ...collectTexts(p?.thicknessMM),
      ...collectTexts(p?.ThicknessMM),
      ...collectTexts(p?.thickness_mm),
    ];
    const thickness = thicknessParts.length
      ? [...new Set(thicknessParts)].join(", ")
      : "-";

    const finishParts = [
      ...collectTexts(p?.selectedFinish),
      ...collectTexts(p?.finish),
      ...collectTexts(p?.Finish),
      ...collectTexts(p?.surface),
      ...collectTexts(p?.surfaceFinish),
      ...collectTexts(p?.finishType),
    ];
    const finish = finishParts.length
      ? [...new Set(finishParts)].join(", ")
      : "-";

    let price = 0;
    if (!isSample(p)) {
      price =
        parsePrice(p?.price) ||
        parsePrice(Array.isArray(p?.price) ? p.price[0] : null) ||
        (Array.isArray(p?.variation)
          ? parsePrice(p.variation.find((v) => v?.price != null)?.price)
          : 0) ||
        parsePrice(p?.selectedPrice);
    }

    const qty = Number(p?.quantity || 1);
    const imgUrl = firstImageUrl(p);
    const subtotal = qty * (Number.isFinite(price) ? price : 0);

    return {
      imgUrl,
      name: sanitize(String(takeText(name) ?? name ?? "-")),
      qty,
      size: sanitize(size),
      thickness: sanitize(thickness),
      finish: sanitize(finish),
      price: Number.isFinite(price) ? price : 0,
      subtotal,
    };
  };

  const exportPDF = async () => {
    try {
      setLoading(true);

      const rawItems = Array.isArray(cartItemsProp) ? cartItemsProp : [];
      const items = await Promise.all(
        rawItems.map(async (ci) => {
          const fromDb = await findProductForCartItem(ci);
          return fromDb ? { ...fromDb, ...ci } : ci;
        })
      );

      const rows = items.map(normalizeCartItem);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 36;
      const marginY = 36;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const tableMaxWidth = pageWidth - marginX * 2;

      // Title
      doc.setFontSize(16);
      doc.text("Cart Items", marginX, marginY);
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        marginX,
        marginY + 14
      );

      // Preload thumbs
      const thumbImages = {};
      await Promise.all(
        rows.map(async (r, i) => {
          const url = r.imgUrl || firstImageUrl(items?.[i] || {});
          if (!url) return;
          const dataUrl = await fetchAsDataURL(url);
          if (dataUrl) thumbImages[i] = dataUrl;
        })
      );

      /* ======= Cart grid (scaled to page) ======= */
      const headerLabels = [
        "Image",
        "Name",
        "Qty",
        "Size",
        "Thickness",
        "Finish",
        "Price",
        "Subtotal",
      ];
      const baseColWidths = [95, 180, 40, 110, 90, 90, 70, 95]; // total 770
      const sumBase = baseColWidths.reduce((a, b) => a + b, 0);
      const scale = tableMaxWidth / sumBase;
      const colWidths = baseColWidths.map((w) => Math.floor(w * scale));
      const headerHeight = 22;
      const headerY = marginY + 30;

      // Blue header bar
      doc.setFillColor(33, 133, 180);
      doc.rect(marginX, headerY, tableMaxWidth, headerHeight, "F");

      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      let x = marginX + 6;
      for (let i = 0; i < headerLabels.length; i++) {
        doc.text(headerLabels[i], x, headerY + headerHeight / 2 + 3);
        x += colWidths[i];
      }
      doc.setTextColor(0, 0, 0);

      // === Fixed thumbnail size + fixed row height ===
      const THUMB_SIZE = Math.min(60, colWidths[0] - 8);
      const FIXED_ROW_H = THUMB_SIZE + 8;

      // Body table
      autoTable(doc, {
        head: [],
        body: rows.map((r) => [
          "",
          r.name,
          String(r.qty),
          r.size,
          r.thickness,
          r.finish,
          String(r.price),
          String(r.subtotal),
        ]),
        startY: headerY + headerHeight,
        showHead: "never",
        theme: "grid",
        tableWidth: tableMaxWidth,
        styles: { fontSize: 9, cellPadding: 5, overflow: "ellipsize" },
        bodyStyles: { minCellHeight: FIXED_ROW_H, valign: "middle" },
        columnStyles: {
          0: { cellWidth: colWidths[0] },
          1: { cellWidth: colWidths[1] },
          2: { cellWidth: colWidths[2] },
          3: { cellWidth: colWidths[3] },
          4: { cellWidth: colWidths[4] },
          5: { cellWidth: colWidths[5] },
          6: { cellWidth: colWidths[6], halign: "right" },
          7: { cellWidth: colWidths[7], halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "body") {
            data.cell.styles.minCellHeight = FIXED_ROW_H; // lock height
            data.cell.styles.overflow = "ellipsize"; // avoid wrapping growth
          }
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const idx = data.row.index;
            const dataUrl = thumbImages[idx];
            if (dataUrl) {
              const pad = 4;
              const x0 = data.cell.x + pad;
              const y0 =
                data.cell.y + Math.max(pad, (FIXED_ROW_H - THUMB_SIZE) / 2);
              try {
                doc.addImage(
                  dataUrl,
                  x0,
                  y0,
                  THUMB_SIZE,
                  THUMB_SIZE,
                  undefined,
                  "FAST"
                );
              } catch {}
            }
          }
        },
        didDrawPage: () => {
          const page = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(
            `Page ${page}`,
            pageWidth - marginX,
            pageHeight - 16,
            { align: "right" }
          );
        },
      });

      /* ======= Product Details pages ======= */
      for (let i = 0; i < items.length; i++) {
        const p = items[i] || {};
        doc.addPage();

        doc.setFontSize(14);
        doc.text("Product Details", marginX, marginY);
        doc.setFontSize(11);
        const title =
          takeText(p?.meta_view?.name ?? p?.meta_view) ?? takeText(p?.name) ?? "-";
        doc.text(sanitize(title), marginX, marginY + 18);

        // Short description
        const desc = takeText(p?.shortDescription);
        let y = marginY + 40;
        if (desc) {
          doc.setFontSize(9);
          const wrapped = doc.splitTextToSize(sanitize(desc), tableMaxWidth);
          doc.text(wrapped, marginX, y);
          y += wrapped.length * 12 + 6;
        }

        // Explicit key fields (pruned as requested)
        const explicitPairs = [];
        const pushPair = (label, value) => {
          if (value == null) return;
          if (Array.isArray(value)) {
            const joined = joinDisplay(value);
            if (joined.trim()) explicitPairs.push([label, joined]);
          } else {
            const val = sanitize(String(value));
            if (val.trim()) explicitPairs.push([label, val]);
          }
        };

        // REMOVED: Product ID, Brand, Space, Attributes, Tags, New
        // Keep these:
        pushPair("Base Color", p?.Base_Color);
        pushPair("Category", p?.category);
        pushPair("Finish", p?.finish);
        pushPair("Thickness", p?.thickness);
        pushPair("Price", p?.price);
        pushPair("Color", p?.color);

        autoTable(doc, {
          head: [["Field", "Value"]],
          body: explicitPairs,
          startY: y,
          theme: "grid",
          tableWidth: tableMaxWidth,
          styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
          headStyles: { overflow: "linebreak" },
          bodyStyles: { overflow: "linebreak", valign: "top" },
          columnStyles: {
            0: { cellWidth: 140, fontStyle: "bold" },
            1: { cellWidth: tableMaxWidth - 140 },
          },
          rowPageBreak: "auto",
        });
        y = doc.lastAutoTable.finalY + 12;

        // Variations
        const vars = extractVariations(p);
        if (vars.length) {
          doc.setFontSize(11);
          doc.text("Available Sizes / Variations", marginX, y);
          y += 8;

          const sizePriceBody = vars.map((v) => [
            sanitize(v.label),
            sanitize(String(v.price ?? "")),
            sanitize(String(v.stock ?? "")),
            sanitize(String(v.extra ?? "")),
          ]);

          autoTable(doc, {
            head: [["Size/Name", "Price", "Stock", "Extra"]],
            body: sizePriceBody,
            startY: y,
            theme: "grid",
            tableWidth: tableMaxWidth,
            styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
            bodyStyles: { overflow: "linebreak", valign: "top" },
            columnStyles: {
              0: { cellWidth: 150 },
              1: { cellWidth: 70 },
              2: { cellWidth: 60 },
              3: { cellWidth: tableMaxWidth - (150 + 70 + 60) },
            },
            rowPageBreak: "auto",
          });
          y = doc.lastAutoTable.finalY + 12;
        }

        // Images (safe spacing so no stretched last image)
        const galleryUrls = allImageUrls(p, 6);
        if (galleryUrls.length) {
          doc.setFontSize(11);
          doc.text("Images", marginX, y);
          y += 8;

          const imgSize = 110;
          const gap = 10;
          let curX = marginX;
          let curY = y;

          const galDataUrls = await Promise.all(
            galleryUrls.map((u) => fetchAsDataURL(u).catch(() => ""))
          );

          for (const d of galDataUrls) {
            if (!d) continue;

            // wrap horizontally
            if (curX + imgSize > pageWidth - marginX) {
              curX = marginX;
              curY += imgSize + gap;
            }

            // ensure vertical space; if not, new page
            if (curY + imgSize > pageHeight - marginY) {
              doc.addPage();
              curX = marginX;
              curY = marginY + 12;
              doc.setFontSize(11);
              doc.text("Images (cont.)", marginX, marginY);
            }

            try {
              doc.addImage(d, curX, curY, imgSize, imgSize, undefined, "FAST");
            } catch {}
            curX += imgSize + gap;
          }
          y = curY + imgSize + 12;
        }

        // Other Fields (skip duplicates + requested exclusions)
        const shownKeys = new Set(
          [
            // keep alignment with explicit table above
            "Base Color",
            "Category",
            "Finish",
            "Thickness",
            "Price",
            "Color",
            // also make sure the removed ones are considered shown (so they never appear)
            "Product ID",
            "Brand",
            "Space",
            "Attributes",
            "Tags",
            "Vendor Id",
            "Meta View",
            "New",
            "Location",
            "Review",
            "Reviews",
            "Rating",
            "Ratings",
            // add to shownKeys (as display labels)
"Id",
"Pin Code",

          ].map((k) => k.toLowerCase())
        );

        const pairs = detailPairs(p).filter(
          ([k]) => !shownKeys.has(k.toLowerCase())
        );
        if (pairs.length) {
          doc.setFontSize(11);
          doc.text("Other Fields", marginX, y);
          y += 8;

          autoTable(doc, {
            head: [["Field", "Value"]],
            body: pairs.map(([k, v]) => [sanitize(k), sanitize(v)]),
            startY: y,
            theme: "grid",
            tableWidth: tableMaxWidth,
            styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
            bodyStyles: { overflow: "linebreak", valign: "top" },
            columnStyles: {
              0: { cellWidth: 160, fontStyle: "bold" },
              1: { cellWidth: tableMaxWidth - 160 },
            },
            rowPageBreak: "auto",
            didDrawPage: () => {
              const page = doc.internal.getNumberOfPages();
              doc.setFontSize(9);
              doc.text(
                `Page ${page}`,
                pageWidth - marginX,
                pageHeight - 16,
                { align: "right" }
              );
            },
          });
        }
      }

      doc.save(`cart_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF creation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportPDF}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: loading ? "#e5e7eb" : "white",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        marginTop: "20px",
        color: "black",
      }}
      title="Download cart as PDF"
    >
      {loading ? "Generating PDF..." : "Download Cart (PDF)"}
    </button>
  );
}
