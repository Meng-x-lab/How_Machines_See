(function () {
  'use strict';

  function defaultPalette() {
    return [
      { name: '晴空蓝', hex: '#60A5FA' },
      { name: '柠檬黄', hex: '#FACC15' },
      { name: '胡萝卜橙', hex: '#FB923C' },
      { name: '草地绿', hex: '#4ADE80' },
      { name: '樱桃红', hex: '#F87171' },
      { name: '棉花糖粉', hex: '#F9A8D4' },
      { name: '葡萄紫', hex: '#C084FC' },
      { name: '薄荷青', hex: '#5EEAD4' },
      { name: '巧克力棕', hex: '#8B6B4F' },
      { name: '奶油白', hex: '#FFF7D6' },
      { name: '夜空灰', hex: '#4B5563' },
      { name: '桃子粉', hex: '#FDBA74' }
    ];
  }

  function createGrid(width, height) {
    return Array.from({ length: height }, function () {
      return Array.from({ length: width }, function () {
        return '';
      });
    });
  }

  function countFilledCells(gridData) {
    return gridData.reduce(function (sum, row) {
      return sum + row.filter(Boolean).length;
    }, 0);
  }

  function normalizePalette(palette) {
    return palette.map(function (item, index) {
      var hex = String(item && item.hex ? item.hex : '').trim().toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(hex)) {
        return null;
      }

      return {
        name: item && item.name ? String(item.name) : ('颜色' + (index + 1)),
        hex: hex
      };
    }).filter(Boolean);
  }

  function normalizePresets(boardPresets) {
    var presets = Array.isArray(boardPresets) ? boardPresets.map(Number).filter(Boolean) : [16, 24];
    presets = Array.from(new Set(presets)).filter(function (value) {
      return value > 0;
    }).sort(function (a, b) {
      return a - b;
    });

    return presets.length ? presets : [16, 24];
  }

  window.initBeadWorkshop = function initBeadWorkshop(config) {
    var sectionId = config && config.sectionId ? config.sectionId : 'bead-section';
    var section = document.getElementById(sectionId);
    if (!section || section.dataset.beadReady === 'true') {
      return null;
    }

    section.dataset.beadReady = 'true';

    var presets = normalizePresets(config && config.boardPresets);
    var palette = normalizePalette(Array.isArray(config && config.palette) && config.palette.length ? config.palette : defaultPalette());
    if (!palette.length) {
      palette = normalizePalette(defaultPalette());
    }

    var gainStar = config && typeof config.gainStar === 'function' ? config.gainStar : function () {};
    var onComplete = config && typeof config.onComplete === 'function' ? config.onComplete : function () {};

    var state = {
      tool: 'brush',
      gridSize: presets[0],
      boardWidth: presets[0],
      boardHeight: presets[0],
      gridData: createGrid(presets[0], presets[0]),
      activeColor: palette[0].hex,
      hasCompleted: false,
      isPainting: false
    };

    var refs = {
      board: section.querySelector('#bead-board'),
      colorPalette: section.querySelector('#bead-color-palette'),
      sizeButtons: section.querySelector('#bead-size-buttons'),
      toolButtons: Array.from(section.querySelectorAll('[data-bead-tool]')),
      statusText: section.querySelector('#bead-status-text'),
      boardSize: section.querySelector('#bead-board-size'),
      filledCount: section.querySelector('#bead-filled-count'),
      completeButton: section.querySelector('#bead-complete-btn'),
      finale: section.querySelector('#bead-finale'),
      closeFinale: section.querySelector('#bead-close-finale'),
      clearButton: section.querySelector('#bead-clear-btn')
    };

    function getColorName(hex) {
      var match = palette.find(function (item) {
        return item.hex === hex;
      });
      return match ? match.name : '彩色拼豆';
    }

    function setStatus(message) {
      if (refs.statusText) {
        refs.statusText.textContent = message;
      }
    }

    function updateCounters() {
      var filled = countFilledCells(state.gridData);

      if (refs.filledCount) {
        refs.filledCount.textContent = filled + ' 颗拼豆';
      }

      if (refs.boardSize) {
        refs.boardSize.textContent = state.boardWidth + ' × ' + state.boardHeight;
      }

      if (refs.completeButton) {
        refs.completeButton.disabled = filled === 0;
        refs.completeButton.textContent = state.hasCompleted ? '作品完成啦，再看一次庆祝卡' : '完成拼豆作品';
      }
    }

    function syncCellAppearance(cell, color) {
      cell.style.removeProperty('--bead-color');
      cell.classList.remove('is-filled');

      if (color) {
        cell.style.setProperty('--bead-color', color);
        cell.classList.add('is-filled');
      }

      cell.setAttribute('aria-label', color ? ('已放置 ' + getColorName(color)) : '空白拼豆位');
    }

    function renderBoard() {
      if (!refs.board) {
        return;
      }

      refs.board.innerHTML = '';
      refs.board.style.gridTemplateColumns = 'repeat(' + state.boardWidth + ', minmax(0, 1fr))';

      var fragment = document.createDocumentFragment();
      for (var row = 0; row < state.boardHeight; row += 1) {
        for (var col = 0; col < state.boardWidth; col += 1) {
          var cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'bead-cell';
          cell.dataset.x = String(col);
          cell.dataset.y = String(row);
          syncCellAppearance(cell, state.gridData[row][col]);
          fragment.appendChild(cell);
        }
      }

      refs.board.appendChild(fragment);
      updateCounters();
    }

    function buildPalette() {
      if (!refs.colorPalette) {
        return;
      }

      refs.colorPalette.innerHTML = '';
      var fragment = document.createDocumentFragment();

      palette.forEach(function (item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'bead-color-chip' + (item.hex === state.activeColor ? ' is-active' : '');
        button.dataset.color = item.hex;
        button.innerHTML = '<span class="bead-color-chip__dot" style="--bead-color:' + item.hex + '"></span><span class="bead-color-chip__name">' + item.name + '</span>';
        fragment.appendChild(button);
      });

      refs.colorPalette.appendChild(fragment);
    }

    function buildSizeButtons() {
      if (!refs.sizeButtons) {
        return;
      }

      refs.sizeButtons.innerHTML = '';
      presets.forEach(function (size) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'bead-pill-btn' + (size === state.gridSize ? ' is-active' : '');
        button.dataset.size = String(size);
        button.textContent = size + ' × ' + size;
        refs.sizeButtons.appendChild(button);
      });
    }

    function updateToolButtons() {
      refs.toolButtons.forEach(function (button) {
        button.classList.toggle('is-active', button.dataset.beadTool === state.tool);
      });
    }

    function updateColorButtons() {
      Array.from(section.querySelectorAll('[data-color]')).forEach(function (button) {
        button.classList.toggle('is-active', button.dataset.color === state.activeColor);
      });
    }

    function setTool(tool) {
      state.tool = tool;
      updateToolButtons();

      if (tool === 'eraser') {
        setStatus('橡皮擦准备好了，划过拼豆板就能把颜色轻轻擦掉。');
      } else {
        setStatus('画笔准备好了，按住拖动可以连续摆放拼豆。');
      }
    }

    function resizeBoard(size) {
      state.gridSize = size;
      state.boardWidth = size;
      state.boardHeight = size;
      state.gridData = createGrid(size, size);
      buildSizeButtons();
      renderBoard();
      setStatus('拼豆板已经换成 ' + size + ' × ' + size + ' 啦，快继续创作吧。');
    }

    function applyColorToCell(cell) {
      var x = Number(cell.dataset.x);
      var y = Number(cell.dataset.y);
      var nextColor = state.tool === 'eraser' ? '' : state.activeColor;

      if (!state.gridData[y] || typeof state.gridData[y][x] === 'undefined') {
        return;
      }

      if (state.gridData[y][x] === nextColor) {
        return;
      }

      state.gridData[y][x] = nextColor;
      syncCellAppearance(cell, nextColor);
      updateCounters();
    }

    if (refs.board) {
      refs.board.addEventListener('pointerdown', function (event) {
        var cell = event.target.closest('.bead-cell');
        if (!cell) {
          return;
        }

        event.preventDefault();
        state.isPainting = true;
        applyColorToCell(cell);
      });

      refs.board.addEventListener('pointerover', function (event) {
        if (!state.isPainting) {
          return;
        }

        var cell = event.target.closest('.bead-cell');
        if (!cell) {
          return;
        }

        event.preventDefault();
        applyColorToCell(cell);
      });
    }

    document.addEventListener('pointerup', function () {
      state.isPainting = false;
    });

    refs.toolButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setTool(button.dataset.beadTool);
      });
    });

    if (refs.colorPalette) {
      refs.colorPalette.addEventListener('click', function (event) {
        var button = event.target.closest('[data-color]');
        if (!button) {
          return;
        }

        state.activeColor = button.dataset.color;
        updateColorButtons();
        if (state.tool === 'brush') {
          setStatus('现在用“' + getColorName(state.activeColor) + '”来拼一拼吧。');
        }
      });
    }

    if (refs.sizeButtons) {
      refs.sizeButtons.addEventListener('click', function (event) {
        var button = event.target.closest('[data-size]');
        if (!button) {
          return;
        }

        resizeBoard(Number(button.dataset.size));
      });
    }

    if (refs.clearButton) {
      refs.clearButton.addEventListener('click', function () {
        state.gridData = createGrid(state.boardWidth, state.boardHeight);
        renderBoard();
        setStatus('拼豆板已经清空啦，可以重新摆出一个新图案。');
      });
    }

    if (refs.completeButton) {
      refs.completeButton.addEventListener('click', function () {
        if (countFilledCells(state.gridData) === 0) {
          setStatus('先放上一些拼豆，才能完成作品哦。');
          return;
        }

        if (!state.hasCompleted) {
          state.hasCompleted = true;
          gainStar();
          onComplete();
        }

        if (refs.finale) {
          refs.finale.classList.remove('hidden');
        }
        updateCounters();
        setStatus('太棒啦，你已经完成了自己的拼豆作品。');
      });
    }

    if (refs.closeFinale) {
      refs.closeFinale.addEventListener('click', function () {
        if (refs.finale) {
          refs.finale.classList.add('hidden');
        }
      });
    }

    buildPalette();
    buildSizeButtons();
    updateToolButtons();
    updateColorButtons();
    renderBoard();
    setStatus('挑一个喜欢的颜色，在圆圆的小拼豆上自由创作吧。');

    return {
      getState: function () {
        return {
          mode: 'draw',
          tool: state.tool,
          gridSize: state.gridSize,
          boardWidth: state.boardWidth,
          boardHeight: state.boardHeight,
          filledCount: countFilledCells(state.gridData),
          hasCompleted: state.hasCompleted
        };
      }
    };
  };
})();