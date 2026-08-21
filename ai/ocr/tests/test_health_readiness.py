import sys
import threading
import time
import types


torch = types.ModuleType("torch")
torchvision = types.ModuleType("torchvision")
torchvision_models = types.ModuleType("torchvision.models")
torchvision_models.resnet18 = lambda **_kwargs: object()
torchvision.models = torchvision_models
sys.modules.setdefault("torch", torch)
sys.modules.setdefault("torchvision", torchvision)
sys.modules.setdefault("torchvision.models", torchvision_models)

ocr_evaluation = types.ModuleType("OCREvaluation")
ocr_evaluation.CRNN = object
ocr_evaluation.correct_prediction = lambda value: value
ocr_evaluation.correct_word = lambda value: value
ocr_evaluation.decode_predictions = lambda *_args: []
ocr_evaluation.make_crnn_input = lambda *_args: (None, None)
sys.modules.setdefault("OCREvaluation", ocr_evaluation)

from app import main


def test_health_loads_ocr_engines_before_reporting_ready(monkeypatch):
    calls = []

    def load_engines():
        calls.append("loaded")
        return object(), object(), object(), object()

    monkeypatch.setattr(main, "engines", load_engines)
    monkeypatch.setattr(main.Path, "is_file", lambda _path: True)

    result = main.health()

    assert calls == ["loaded"]
    assert result["models_loaded"] is True


def test_engine_initialization_is_single_flight(monkeypatch):
    calls = []
    results = []
    engine_set = (object(), object(), object(), object())

    def initialize():
        calls.append("initialize")
        time.sleep(0.05)
        return engine_set

    monkeypatch.setattr(main, "_engines_cache", None, raising=False)
    monkeypatch.setattr(main, "_initialize_engines", initialize, raising=False)
    workers = [
        threading.Thread(target=lambda: results.append(main.engines()))
        for _index in range(2)
    ]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join()

    assert calls == ["initialize"]
    assert results == [engine_set, engine_set]
