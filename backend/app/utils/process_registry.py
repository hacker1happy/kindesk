from dataclasses import dataclass
from typing import Any, Callable, Dict, List

from app.utils import duplicate_form_data_transformer, transmission_form_data_transformer


@dataclass(frozen=True)
class ProcessConfig:
    transformer: Callable[[Dict[str, Any]], Dict[str, str]]
    selected_files_transformer: Callable[[List[str]], List[str]]
    template_process: str
    modifier_process: str


PROCESS_CONFIGS = {
    "duplicate": ProcessConfig(
        transformer=duplicate_form_data_transformer.transform_input_data,
        selected_files_transformer=duplicate_form_data_transformer.transform_selected_files,
        template_process="duplicate",
        modifier_process="duplicate",
    ),
    "transmission": ProcessConfig(
        transformer=transmission_form_data_transformer.transform_input_data,
        selected_files_transformer=transmission_form_data_transformer.transform_selected_files,
        template_process="transmission_duplicate",
        modifier_process="transmission",
    ),
    "joint": ProcessConfig(
        transformer=transmission_form_data_transformer.transform_input_data,
        selected_files_transformer=transmission_form_data_transformer.transform_joint_selected_files,
        template_process="transmission_duplicate",
        modifier_process="both",
    ),
}


def get_process_config(process: str) -> ProcessConfig:
    normalized_process = process.lower()

    if normalized_process not in PROCESS_CONFIGS:
        raise ValueError(f"Unsupported process type: {process}")

    return PROCESS_CONFIGS[normalized_process]
